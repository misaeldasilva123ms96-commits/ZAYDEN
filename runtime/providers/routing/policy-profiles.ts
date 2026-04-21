import type { FailureClass } from "../resilience/failure-classifier.js";
import { DEFAULT_RETRY_POLICY, mergeRetryPolicy, type RetryPolicy } from "../resilience/retry-policy.js";
import type { EnvironmentProfile, RoutingPolicy } from "./routing-types.js";

function envProfile(): EnvironmentProfile | undefined {
  const raw = process.env.ZAYDEN_ENV ?? process.env.NODE_ENV;
  if (raw === "production" || raw === "prod") return "production";
  if (raw === "test" || raw === "testing") return "testing";
  if (raw === "development" || raw === "dev") return "development";
  return undefined;
}

export function resolveEnvironmentProfile(
  explicit?: EnvironmentProfile,
): EnvironmentProfile {
  return explicit ?? envProfile() ?? "development";
}

const testingRetryOn: readonly FailureClass[] = [
  "TIMEOUT",
  "NETWORK_ERROR",
  "PROVIDER_ERROR",
];
const testingRetry: RetryPolicy = mergeRetryPolicy(DEFAULT_RETRY_POLICY, {
  max_attempts: 2,
  retry_delay_ms: 0,
  retry_on: testingRetryOn,
});

const developmentRetry: RetryPolicy = mergeRetryPolicy(DEFAULT_RETRY_POLICY, {
  max_attempts: 2,
  retry_delay_ms: 50,
  retry_on: testingRetryOn,
});

const productionRetryOn: readonly FailureClass[] = ["TIMEOUT", "NETWORK_ERROR"];
const productionRetry: RetryPolicy = mergeRetryPolicy(DEFAULT_RETRY_POLICY, {
  max_attempts: 2,
  retry_delay_ms: 200,
  retry_on: productionRetryOn,
});

export function routingPolicyPatchForProfile(
  profile: EnvironmentProfile,
): Partial<RoutingPolicy> {
  switch (profile) {
    case "development":
      return {
        timeout_policy: { per_attempt_ms: 120_000, total_ms: 300_000 },
        retry_policy: developmentRetry,
        simulation_policy: {
          allow_simulated_local_fallback: true,
        },
      };
    case "testing":
      return {
        timeout_policy: { per_attempt_ms: 5_000, total_ms: 15_000 },
        retry_policy: testingRetry,
        simulation_policy: {
          allow_simulated_local_fallback: true,
        },
      };
    case "production":
      return {
        timeout_policy: { per_attempt_ms: 30_000, total_ms: 90_000 },
        retry_policy: productionRetry,
        simulation_policy: {
          allow_simulated_local_fallback: false,
        },
      };
    default:
      return {};
  }
}
