import type { ProviderRequest } from "../contracts/index.js";
import { mapRoutingEnvelopeToPublic, mapUnknownErrorToPublic } from "../api/normalization/api-errors.js";
import type { PublicErrorBody } from "../api/normalization/api-errors.js";
import type { NormalizedChatInput } from "../api/normalization/request-normalizer.js";
import { buildPublicChatResponse } from "../api/normalization/response-normalizer.js";
import type { MemoryLoadObservation } from "../memory/base/memory.types.js";
import type { ProviderRegistry } from "../providers/registry/provider-registry.js";
import type { RoutingRequestInput } from "../providers/routing/routing-types.js";
import { RuntimeOrchestrator } from "./runtime-orchestrator.js";
import { MemoryOrchestrator } from "./memory-orchestrator.js";

export interface RuntimeServiceDependencies {
  readonly orchestrator: RuntimeOrchestrator;
  readonly registry: ProviderRegistry;
  readonly memoryOrchestrator?: MemoryOrchestrator;
}

export type RuntimeServiceChatOutcome =
  | {
      kind: "success";
      public_response: Record<string, unknown>;
      latency_ms: number;
    }
  | {
      kind: "error";
      http_status: number;
      public_error: PublicErrorBody;
    };

function buildSystemPrefixFromMemory(memory_context: unknown): string {
  if (!memory_context || typeof memory_context !== "object") return "";
  const entries = (memory_context as { entries?: { text?: string }[] }).entries;
  if (!entries?.length) return "";
  const joined = entries.map((e) => e.text ?? "").join("\n\n");
  return joined.length > 4_000 ? joined.slice(0, 4_000) : joined;
}

/**
 * Single internal entrypoint for the HTTP API layer (Phase 9). No transport concerns here.
 */
export class RuntimeService {
  constructor(private readonly deps: RuntimeServiceDependencies) {}

  async executeChat(params: {
    request_id: string;
    normalized: NormalizedChatInput;
  }): Promise<RuntimeServiceChatOutcome> {
    const started = Date.now();
    const { normalized, request_id } = params;
    let memory_obs: MemoryLoadObservation | null = null;
    let memory_context: unknown = {
      contract_version: "1.0.0",
      metadata: { pipeline: "zayden.runtime-service", skipped: true },
    };

    try {
      if (this.deps.memoryOrchestrator) {
        const m = normalized.memory_policy;
        if (m.enable_session_state || m.enable_persistent_memory) {
          const built = await this.deps.memoryOrchestrator.buildMemoryContext({
            session_id: normalized.session_id,
            policy: m,
            ensure_session: normalized.ensure_session,
          });
          memory_context = built.memory_context;
          memory_obs = built.observation;
        }
      }

      const systemPrefix = buildSystemPrefixFromMemory(memory_context);
      const messages: ProviderRequest["payload"]["messages"] = [];
      if (systemPrefix.trim().length > 0) {
        messages.push({ role: "system", content: systemPrefix });
      }
      messages.push({ role: "user", content: normalized.input });

      const providerRequest: ProviderRequest = {
        contract_version: "1.0.0",
        correlation_id: request_id,
        session_id: normalized.session_id,
        payload: { messages },
        parameters: {},
      };

      const routingInput: RoutingRequestInput = {
        request: providerRequest,
        requested_mode: normalized.mode,
        requested_provider: normalized.provider,
        policy: normalized.routing_policy_override,
      };

      const routing = await this.deps.orchestrator.route(routingInput);
      const latency_ms = Math.max(0, Date.now() - started);

      if (routing.error) {
        const mapped = mapRoutingEnvelopeToPublic({
          request_id,
          envelope: routing.error,
          session_id: normalized.session_id,
        });
        const status = routing.resilience?.timeout_triggered ? 408 : mapped.status;
        return { kind: "error", http_status: status, public_error: mapped.body };
      }

      const public_response = buildPublicChatResponse({
        request_id,
        session_id: normalized.session_id,
        routing,
        memory_observation: memory_obs,
        latency_ms,
      });

      return { kind: "success", public_response, latency_ms };
    } catch (e) {
      const mapped = mapUnknownErrorToPublic({
        request_id,
        error: e,
        session_id: normalized.session_id,
      });
      return { kind: "error", http_status: mapped.status, public_error: mapped.body };
    }
  }

  describeReadiness(): { ready: boolean; reason?: string } {
    if (this.deps.registry.listIds().length === 0) {
      return { ready: false, reason: "no provider adapters registered" };
    }
    return { ready: true };
  }
}
