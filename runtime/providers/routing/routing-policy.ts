import { DEFAULT_RETRY_POLICY, mergeRetryPolicy } from "../resilience/retry-policy.js";
import type { RoutingPolicy } from "./routing-types.js";

export const DEFAULT_ROUTING_POLICY: RoutingPolicy = {
  default_mode: "HYBRID",
  preferred_local_provider: "gemma-local",
  preferred_cloud_provider: null,
  allow_fallback: true,
  fallback_order: [],
  strict_local_only: true,
  strict_cloud_only: true,
  timeout_policy: {
    per_attempt_ms: 30_000,
    total_ms: 90_000,
  },
  retry_policy: DEFAULT_RETRY_POLICY,
  simulation_policy: {
    allow_simulated_local_fallback: true,
  },
  hybrid_preference: "local_first",
};

export function resolveRoutingPolicy(
  override?: Partial<RoutingPolicy>,
): RoutingPolicy {
  const merged: RoutingPolicy = {
    ...DEFAULT_ROUTING_POLICY,
    ...override,
    timeout_policy: {
      ...DEFAULT_ROUTING_POLICY.timeout_policy,
      ...(override?.timeout_policy ?? {}),
    },
    retry_policy: mergeRetryPolicy(
      DEFAULT_RETRY_POLICY,
      {
        ...DEFAULT_ROUTING_POLICY.retry_policy,
        ...(override?.retry_policy ?? {}),
      },
    ),
    simulation_policy: {
      ...DEFAULT_ROUTING_POLICY.simulation_policy,
      ...(override?.simulation_policy ?? {}),
    },
    fallback_order: [...(override?.fallback_order ?? DEFAULT_ROUTING_POLICY.fallback_order)],
  };

  if (merged.fallback_order.some((id) => id.trim().length === 0)) {
    throw new Error("[zayden:routing] fallback_order contains empty adapter id");
  }
  if (merged.strict_local_only && merged.default_mode === "LOCAL_ONLY") {
    // expected; no-op. This branch keeps intent explicit.
  }
  return merged;
}
