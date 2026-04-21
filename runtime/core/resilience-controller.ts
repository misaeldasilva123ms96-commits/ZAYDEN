import type { ProviderResponse } from "../contracts/index.js";
import { ChaosInjector } from "../providers/harness/chaos-injector.js";
import { classifyFailure, type FailureClass } from "../providers/resilience/failure-classifier.js";
import { computeRetryDecision, type RetryPolicy } from "../providers/resilience/retry-policy.js";
import { withTimeout, ZaydenTimeoutError } from "../providers/resilience/timeout-controller.js";
import type { ResilienceTelemetry } from "../providers/routing/routing-types.js";

export interface ResilienceExecuteParams {
  adapterId: string;
  execute: () => Promise<ProviderResponse>;
  per_attempt_timeout_ms: number;
  retry_policy: RetryPolicy;
  chaos?: ChaosInjector;
  onObserve?: (line: string) => void;
}

function emptyTelemetry(): ResilienceTelemetry {
  return {
    retry_count: 0,
    timeout_triggered: false,
    failure_type: null,
    chaos_applied: false,
    execution_attempts: 0,
  };
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}

export type ResilienceOutcome =
  | { ok: true; response: ProviderResponse; telemetry: ResilienceTelemetry }
  | { ok: false; error: unknown; telemetry: ResilienceTelemetry };

/**
 * Wraps a single adapter execution with explicit timeout, optional chaos, and bounded retries.
 * Does not change routing order — callers still own provider fallback sequencing.
 */
export class ResilienceController {
  async execute(params: ResilienceExecuteParams): Promise<ResilienceOutcome> {
    const chaos = params.chaos ?? ChaosInjector.disabled();
    const telemetry = emptyTelemetry();
    let attemptIndex = 0;

    for (;;) {
      telemetry.execution_attempts += 1;
      const chaosTouched = await chaos.preExecute(params.adapterId, attemptIndex);
      if (chaosTouched) telemetry.chaos_applied = true;

      try {
        const response = await withTimeout(
          () => params.execute(),
          params.per_attempt_timeout_ms,
        );
        telemetry.retry_count = Math.max(0, attemptIndex);
        telemetry.failure_type = null;
        return { ok: true, response, telemetry };
      } catch (error) {
        if (error instanceof ZaydenTimeoutError) {
          telemetry.timeout_triggered = true;
        }
        const classified = classifyFailure(error);
        telemetry.failure_type = classified.class as FailureClass;
        params.onObserve?.(
          `RESILIENCE:attempt=${attemptIndex}:failure=${classified.class}:retry_allowed=${classified.retry_allowed}`,
        );

        const decision = computeRetryDecision({
          attemptIndex,
          policy: params.retry_policy,
          failureClass: classified.class,
        });

        if (!decision.will_retry) {
          return { ok: false, error, telemetry };
        }

        params.onObserve?.(
          `RESILIENCE:retry_scheduled:from_attempt=${attemptIndex}:to=${decision.next_attempt_index}:delay_ms=${params.retry_policy.retry_delay_ms}`,
        );
        await sleep(params.retry_policy.retry_delay_ms);
        attemptIndex = decision.next_attempt_index;
      }
    }
  }
}
