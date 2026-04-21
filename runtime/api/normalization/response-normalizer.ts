import type { ProviderActual } from "../../contracts/index.js";
import type { RoutingResult } from "../../providers/routing/routing-types.js";
import type { MemoryLoadObservation } from "../../memory/base/memory.types.js";
import { getPublicApiValidators } from "./public-validators.js";

function publicWarnings(warnings: readonly string[]): string[] {
  return warnings.filter((w) => !w.startsWith("RESILIENCE:"));
}

function summarizeFallback(
  fr: RoutingResult["fallback_reason"],
): { did_fallback: boolean; code?: string | null } | null {
  if (!fr) return null;
  return { did_fallback: fr.did_fallback, code: fr.code ?? null };
}

function safeProviderActual(p: ProviderActual | null): Record<string, unknown> | null {
  if (!p) return null;
  return {
    kind: p.kind,
    name: p.name,
    model: p.model,
  };
}

export function buildPublicChatResponse(params: {
  request_id: string;
  session_id: string;
  routing: RoutingResult;
  memory_observation: MemoryLoadObservation | null;
  latency_ms: number;
}): Record<string, unknown> {
  const ok = params.routing.error === null && params.routing.response !== null;
  const obs = params.routing.observability;
  const memory_hits = params.memory_observation
    ? params.memory_observation.recent_turn_count_used +
      params.memory_observation.persistent_entries_used
    : 0;
  const out: Record<string, unknown> = {
    api_version: "1.0.0",
    request_id: params.request_id,
    session_id: params.session_id,
    status: ok ? "success" : "error",
    output: ok ? (params.routing.response?.text ?? "") : "",
    runtime_mode: params.routing.runtime_mode,
    provider_requested: params.routing.provider_requested,
    provider_actual: safeProviderActual(params.routing.provider_actual),
    fallback_reason: summarizeFallback(params.routing.fallback_reason),
    tool_calls: [] as { tool_name: string; status: string }[],
    warnings: publicWarnings(obs.warnings),
    latency_ms: params.latency_ms,
    response_source: "runtime",
    error_type: params.routing.error?.error_type ?? null,
    memory_hits,
    metadata: {
      tool_policy_version: "1.0.0",
      routing: { fallback_triggered: obs.fallback_triggered },
      memory_pipeline: params.memory_observation
        ? {
            session_found: params.memory_observation.session_found,
            context_trimmed: params.memory_observation.context_trimmed,
            budget_estimate: params.memory_observation.budget_estimate,
          }
        : { skipped: true },
    },
  };
  const v = getPublicApiValidators().validatePublicChatResponse;
  if (!v(out)) {
    throw new Error(`public response failed schema: ${JSON.stringify(v.errors)}`);
  }
  return out;
}

export function assertPublicErrorPayload(payload: unknown): void {
  const v = getPublicApiValidators().validatePublicErrorResponse;
  if (!v(payload)) {
    throw new Error(`public error payload invalid: ${JSON.stringify(v.errors)}`);
  }
}
