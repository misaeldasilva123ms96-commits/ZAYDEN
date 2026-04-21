import type { ProviderActual, ProviderRequest } from "../contracts/index.js";
import type { ContractValidators } from "../contracts/index.js";
import { ProviderExecutionError } from "../providers/base/provider.errors.js";
import { chaosInjectorFromPlan } from "../providers/harness/provider-harness.js";
import type { ProviderGateway, ProviderRegistry } from "../providers/registry/provider-registry.js";
import { classifyFailure } from "../providers/resilience/failure-classifier.js";
import { DEFAULT_RETRY_POLICY, mergeRetryPolicy } from "../providers/resilience/retry-policy.js";
import { shouldAttemptFallback } from "../providers/routing/fallback-policy.js";
import {
  resolveEnvironmentProfile,
  routingPolicyPatchForProfile,
} from "../providers/routing/policy-profiles.js";
import { resolveRoutingPolicy } from "../providers/routing/routing-policy.js";
import { selectProviderOrder } from "../providers/routing/provider-selection.js";
import type {
  AdapterCatalogEntry,
  ResilienceTelemetry,
  RoutingMode,
  RoutingPolicy,
  RoutingRequestInput,
  RoutingResult,
  RuntimeErrorEnvelope,
  RuntimeInspectionView,
} from "../providers/routing/routing-types.js";
import { ResilienceController } from "./resilience-controller.js";

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

function emptyResilience(): ResilienceTelemetry {
  return {
    retry_count: 0,
    timeout_triggered: false,
    failure_type: null,
    chaos_applied: false,
    execution_attempts: 0,
  };
}

function mergeResilienceAggregate(
  agg: ResilienceTelemetry,
  partial: ResilienceTelemetry,
): void {
  agg.retry_count += partial.retry_count;
  agg.execution_attempts += partial.execution_attempts;
  agg.timeout_triggered ||= partial.timeout_triggered;
  agg.chaos_applied ||= partial.chaos_applied;
  agg.failure_type = partial.failure_type;
}

function annotateInspectionWithResilience(
  inspection: RuntimeInspectionView,
  telemetry: ResilienceTelemetry,
): void {
  inspection.warnings.push(`RESILIENCE:retry_count=${telemetry.retry_count}`);
  inspection.warnings.push(`RESILIENCE:timeout_triggered=${telemetry.timeout_triggered}`);
  inspection.warnings.push(
    `RESILIENCE:failure_type=${telemetry.failure_type ?? "none"}`,
  );
  inspection.warnings.push(`RESILIENCE:chaos_applied=${telemetry.chaos_applied}`);
  inspection.warnings.push(
    `RESILIENCE:execution_attempts=${telemetry.execution_attempts}`,
  );
  inspection.execution_path.push(
    `RESILIENCE:summary:attempts=${telemetry.execution_attempts}:retries=${telemetry.retry_count}:chaos=${telemetry.chaos_applied}`,
  );
}

function isRecoverableProviderFailure(error: unknown): boolean {
  return classifyFailure(error).recoverable;
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
    private readonly resilience: ResilienceController = new ResilienceController(),
  ) {}

  async route(input: RoutingRequestInput): Promise<RoutingResult> {
    this.validators.assertValidProviderRequest(input.request);
    const started = Date.now();
    const profile = resolveEnvironmentProfile(input.environment_profile);
    const policy = resolveRoutingPolicy({
      ...this.basePolicy,
      ...routingPolicyPatchForProfile(profile),
      ...(input.policy ?? {}),
    });
    const mode = input.requested_mode ?? policy.default_mode;
    const providerRequested = input.requested_provider ?? null;
    const inspection = emptyInspection(mode);
    const resilienceAgg = emptyResilience();
    inspection.execution_path.push(`MODE:${mode}`);
    inspection.execution_path.push(`PROFILE:${profile}`);

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
        resilience: emptyResilience(),
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
        resilience: emptyResilience(),
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
        const chaos = chaosInjectorFromPlan(input.simulation?.chaos);
        const retryPolicy = mergeRetryPolicy(
          DEFAULT_RETRY_POLICY,
          policy.retry_policy ?? {},
        );
        const perAttemptMs = policy.timeout_policy?.per_attempt_ms ?? 30_000;
        const outcome = await this.resilience.execute({
          adapterId,
          execute: () => this.gateway.execute(adapterId, input.request),
          per_attempt_timeout_ms: perAttemptMs,
          retry_policy: retryPolicy,
          chaos,
          onObserve: (line) => {
            inspection.execution_path.push(line);
            inspection.warnings.push(line);
          },
        });

        if (!outcome.ok) {
          throw outcome.error;
        }

        mergeResilienceAggregate(resilienceAgg, outcome.telemetry);
        const response = outcome.response;
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
        annotateInspectionWithResilience(inspection, resilienceAgg);
        const providerActual: ProviderActual = response.provider_actual;
        return {
          response,
          error: null,
          runtime_mode: mode,
          provider_requested: providerRequested,
          provider_actual: providerActual,
          fallback_reason: fallbackReason,
          observability: inspection,
          resilience: { ...resilienceAgg },
        };
      } catch (error) {
        lastError = error;
        const classified = classifyFailure(error);
        const recoverable = classified.recoverable;
        const hasAnotherCandidate = i < order.length - 1;
        const allowNext = shouldAttemptFallback({
          mode,
          policy,
          attemptIndex: i,
          hasAnotherCandidate,
          lastFailureRecoverable: recoverable,
          lastFailureFallbackAllowed: classified.fallback_allowed,
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
        annotateInspectionWithResilience(inspection, resilienceAgg);
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
          resilience: { ...resilienceAgg },
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
    annotateInspectionWithResilience(inspection, resilienceAgg);
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
      resilience: { ...resilienceAgg },
    };
  }
}
