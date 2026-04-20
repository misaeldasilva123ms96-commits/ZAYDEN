import type { ProviderActual, ProviderRequest } from "../contracts/index.js";
import type { ContractValidators } from "../contracts/index.js";
import { ProviderExecutionError, ProviderUnavailableError } from "../providers/base/provider.errors.js";
import type { ProviderGateway, ProviderRegistry } from "../providers/registry/provider-registry.js";
import { shouldAttemptFallback } from "../providers/routing/fallback-policy.js";
import { resolveRoutingPolicy } from "../providers/routing/routing-policy.js";
import { selectProviderOrder } from "../providers/routing/provider-selection.js";
import type {
  AdapterCatalogEntry,
  RoutingMode,
  RoutingPolicy,
  RoutingRequestInput,
  RoutingResult,
  RuntimeErrorEnvelope,
  RuntimeInspectionView,
} from "../providers/routing/routing-types.js";

function makeRuntimeError(
  error_type: RuntimeErrorEnvelope["error_type"],
  message: string,
  recoverable: boolean,
  metadata: Record<string, unknown>,
): RuntimeErrorEnvelope {
  return {
    contract_version: "1.0.0",
    error_type,
    message,
    origin: error_type === "PROVIDER_EXECUTION_ERROR" ? "provider" : "runtime",
    recoverable,
    metadata,
  };
}

function emptyInspection(mode: RoutingMode): RuntimeInspectionView {
  return {
    contract_version: "1.0.0",
    runtime_mode: mode,
    execution_path: ["ROUTING_START"],
    provider_chain: [],
    fallback_triggered: false,
    tool_execution_count: 0,
    latency_ms: 0,
    warnings: [],
  };
}

function isRecoverableProviderFailure(error: unknown): boolean {
  if (error instanceof ProviderUnavailableError) return true;
  if (error instanceof ProviderExecutionError) return error.envelope.recoverable;
  return false;
}

async function toCatalog(registry: ProviderRegistry): Promise<AdapterCatalogEntry[]> {
  const out: AdapterCatalogEntry[] = [];
  for (const id of registry.listIds()) {
    const adapter = registry.get(id);
    if (!adapter) continue;
    out.push({
      id: adapter.id,
      kind: adapter.kind,
      available: await adapter.isAvailable(),
    });
  }
  return out;
}

export class RuntimeOrchestrator {
  constructor(
    private readonly validators: ContractValidators,
    private readonly gateway: ProviderGateway,
    private readonly registry: ProviderRegistry,
    private readonly basePolicy: RoutingPolicy = resolveRoutingPolicy(),
  ) {}

  async route(input: RoutingRequestInput): Promise<RoutingResult> {
    this.validators.assertValidProviderRequest(input.request);
    const started = Date.now();
    const policy = resolveRoutingPolicy({ ...this.basePolicy, ...(input.policy ?? {}) });
    const mode = input.requested_mode ?? policy.default_mode;
    const providerRequested = input.requested_provider ?? null;
    const inspection = emptyInspection(mode);
    inspection.execution_path.push(`MODE:${mode}`);

    const selection = selectProviderOrder({
      catalog: await toCatalog(this.registry),
      mode,
      requestedProvider: providerRequested,
      policy,
    });

    if ("code" in selection) {
      const err = makeRuntimeError(selection.code, selection.message, false, selection.metadata);
      inspection.execution_path.push("ROUTING_SELECTION_FAILED");
      inspection.warnings.push(selection.message);
      inspection.latency_ms = Date.now() - started;
      return {
        response: null,
        error: err,
        runtime_mode: mode,
        provider_requested: providerRequested,
        provider_actual: null,
        fallback_reason: null,
        observability: inspection,
      };
    }

    inspection.warnings.push(...selection.warnings);
    const order = selection.selectedOrder;
    if (order.length === 0) {
      const err = makeRuntimeError(
        "NO_PROVIDER_AVAILABLE",
        `No candidate providers for mode ${mode}`,
        false,
        { mode, provider_requested: providerRequested },
      );
      inspection.execution_path.push("ROUTING_SELECTION_EMPTY");
      inspection.latency_ms = Date.now() - started;
      return {
        response: null,
        error: err,
        runtime_mode: mode,
        provider_requested: providerRequested,
        provider_actual: null,
        fallback_reason: null,
        observability: inspection,
      };
    }

    let lastError: unknown = null;
    let fallbackReason: RoutingResult["fallback_reason"] = null;

    for (let i = 0; i < order.length; i += 1) {
      const adapterId = order[i];
      const adapter = this.registry.get(adapterId);
      if (!adapter) {
        inspection.warnings.push(`adapter ${adapterId} disappeared from registry`);
        continue;
      }

      inspection.execution_path.push(`ATTEMPT:${adapterId}`);
      inspection.provider_chain.push({ name: adapter.id, kind: adapter.kind });

      try {
        const response = await this.gateway.execute(adapterId, input.request);
        const fallbackTriggered = i > 0;
        if (fallbackTriggered) {
          inspection.execution_path.push(`FALLBACK_SUCCESS:${adapterId}`);
          fallbackReason = {
            did_fallback: true,
            code: "FALLBACK_AFTER_FAILURE",
            detail: `Recovered on ${adapterId} after previous provider failure`,
          };
        }
        inspection.fallback_triggered = fallbackTriggered;
        inspection.execution_path.push("ROUTING_DONE");
        inspection.latency_ms = Date.now() - started;
        const providerActual: ProviderActual = response.provider_actual;
        return {
          response,
          error: null,
          runtime_mode: mode,
          provider_requested: providerRequested,
          provider_actual: providerActual,
          fallback_reason: fallbackReason,
          observability: inspection,
        };
      } catch (error) {
        lastError = error;
        const recoverable = isRecoverableProviderFailure(error);
        const hasAnotherCandidate = i < order.length - 1;
        const allowNext = shouldAttemptFallback({
          mode,
          policy,
          attemptIndex: i,
          hasAnotherCandidate,
          lastFailureRecoverable: recoverable,
        });
        inspection.warnings.push(
          error instanceof Error ? error.message : "provider failure",
        );
        if (allowNext) {
          inspection.fallback_triggered = true;
          inspection.execution_path.push(`FALLBACK_FROM:${adapterId}`);
          continue;
        }

        let err: RuntimeErrorEnvelope | undefined;
        if (hasAnotherCandidate && !allowNext) {
          err = makeRuntimeError(
            "FALLBACK_NOT_ALLOWED",
            `Fallback blocked after failure on ${adapterId}`,
            recoverable,
            { mode, provider_requested: providerRequested, attempted_provider: adapterId },
          );
        } else if (error instanceof ProviderExecutionError) {
          err = error.envelope;
        } else if (!hasAnotherCandidate) {
          err = makeRuntimeError(
            "NO_PROVIDER_AVAILABLE",
            "No provider completed successfully for requested mode",
            recoverable,
            { mode, provider_requested: providerRequested, attempted_provider: adapterId },
          );
        }
        if (!err) {
          err = makeRuntimeError(
            "ROUTING_POLICY_VIOLATION",
            "Routing failed with an unclassified provider error",
            recoverable,
            { mode, provider_requested: providerRequested, attempted_provider: adapterId },
          );
        }
        inspection.execution_path.push("ROUTING_FAILED");
        inspection.latency_ms = Date.now() - started;
        return {
          response: null,
          error: err,
          runtime_mode: mode,
          provider_requested: providerRequested,
          provider_actual: null,
          fallback_reason: inspection.fallback_triggered
            ? {
                did_fallback: true,
                code: "FALLBACK_FAILED",
                detail: "Fallback was attempted but no candidate succeeded",
              }
            : null,
          observability: inspection,
        };
      }
    }

    const exhausted = makeRuntimeError(
      "NO_PROVIDER_AVAILABLE",
      "Routing exhausted all candidate providers",
      isRecoverableProviderFailure(lastError),
      { mode, provider_requested: providerRequested },
    );
    inspection.execution_path.push("ROUTING_EXHAUSTED");
    inspection.latency_ms = Date.now() - started;
    return {
      response: null,
      error: exhausted,
      runtime_mode: mode,
      provider_requested: providerRequested,
      provider_actual: null,
      fallback_reason: inspection.fallback_triggered
        ? {
            did_fallback: true,
            code: "FALLBACK_EXHAUSTED",
            detail: "All fallback candidates failed",
          }
        : null,
      observability: inspection,
    };
  }
}
