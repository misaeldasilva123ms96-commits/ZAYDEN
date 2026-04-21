import { FAILURE_ATTRIBUTES, type FailureClass } from "./failure-classifier.js";

export interface RetryPolicy {
  max_attempts: number;
  retry_delay_ms: number;
  retry_on: readonly FailureClass[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  max_attempts: 1,
  retry_delay_ms: 0,
  retry_on: [],
};

export function mergeRetryPolicy(
  base: RetryPolicy,
  partial?: Partial<RetryPolicy>,
): RetryPolicy {
  return {
    max_attempts: Math.max(1, partial?.max_attempts ?? base.max_attempts),
    retry_delay_ms: Math.max(0, partial?.retry_delay_ms ?? base.retry_delay_ms),
    retry_on: partial?.retry_on ?? base.retry_on,
  };
}

/**
 * After a failed attempt at `attemptIndex` (0-based), returns whether another attempt is allowed.
 * Total attempts are capped by `policy.max_attempts`.
 */
export function computeRetryDecision(params: {
  attemptIndex: number;
  policy: RetryPolicy;
  failureClass: FailureClass;
}): { will_retry: boolean; next_attempt_index: number } {
  const completed = params.attemptIndex + 1;
  const will_retry =
    completed < params.policy.max_attempts &&
    params.policy.retry_on.includes(params.failureClass) &&
    FAILURE_ATTRIBUTES[params.failureClass].retry_allowed;
  return {
    will_retry,
    next_attempt_index: will_retry ? params.attemptIndex + 1 : params.attemptIndex,
  };
}
