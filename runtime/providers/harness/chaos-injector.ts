import type { FailureClass } from "../resilience/failure-classifier.js";
import { ChaosInducedError } from "../resilience/failure-classifier.js";

export type ChaosScheduleKey = `${string}@${number}`;

export interface ChaosStep {
  latency_ms?: number;
  force_failure?: FailureClass;
}

/**
 * Deterministic chaos: callers pass an explicit schedule keyed by `adapterId@attemptIndex`.
 * Disabled by default (`enabled: false`) — production paths must opt in explicitly (tests/harness).
 */
export class ChaosInjector {
  constructor(
    private readonly enabled: boolean,
    private readonly schedule: Readonly<Record<string, ChaosStep>> = {},
  ) {}

  static disabled(): ChaosInjector {
    return new ChaosInjector(false, {});
  }

  static fromSchedule(schedule: Readonly<Record<string, ChaosStep>>): ChaosInjector {
    return new ChaosInjector(true, schedule);
  }

  key(adapterId: string, attemptIndex: number): ChaosScheduleKey {
    return `${adapterId}@${attemptIndex}` as ChaosScheduleKey;
  }

  async preExecute(adapterId: string, attemptIndex: number): Promise<boolean> {
    if (!this.enabled) return false;
    const step = this.schedule[this.key(adapterId, attemptIndex)];
    if (!step) return false;
    if (step.latency_ms && step.latency_ms > 0) {
      await delay(step.latency_ms);
    }
    if (step.force_failure) {
      throw new ChaosInducedError(step.force_failure);
    }
    return Boolean(step.latency_ms || step.force_failure);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
