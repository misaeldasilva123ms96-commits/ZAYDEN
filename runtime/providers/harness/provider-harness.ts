import type { ProviderRequest, ProviderResponse } from "../../contracts/index.js";
import { createContractValidators } from "../../contracts/index.js";
import { ProviderExecutionError } from "../base/provider.errors.js";
import type { ProviderAdapter } from "../base/provider.interface.js";
import type { ProviderKind } from "../base/provider.types.js";
import { ProviderGateway, ProviderRegistry } from "../registry/provider-registry.js";
import type { ChaosPlan } from "../routing/routing-types.js";
import { ChaosInjector } from "./chaos-injector.js";
import type { HarnessScenario, HarnessScenarioId } from "./provider-scenarios.js";
import { PROVIDER_SCENARIOS } from "./provider-scenarios.js";

export function chaosInjectorFromPlan(plan?: ChaosPlan | null): ChaosInjector {
  if (!plan?.enabled) return ChaosInjector.disabled();
  return ChaosInjector.fromSchedule(plan.schedule ?? {});
}

class HarnessScriptedAdapter implements ProviderAdapter {
  private attempt = 0;

  constructor(
    readonly id: string,
    readonly kind: ProviderKind,
    private readonly scenario: HarnessScenario,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    const step =
      this.scenario.attempts[this.attempt] ??
      this.scenario.attempts[this.scenario.attempts.length - 1]!;
    this.attempt += 1;

    if (step.latency_ms && step.latency_ms > 0) {
      await new Promise((r) => setTimeout(r, step.latency_ms));
    }
    if (step.fail) {
      throw new ProviderExecutionError({
        contract_version: "1.0.0",
        error_type: "PROVIDER_EXECUTION_ERROR",
        message: `${this.id}: harness failure`,
        origin: "provider",
        recoverable: true,
        metadata: { adapter: this.id, harness: true },
      });
    }
    if (step.invalid_shape) {
      return { not_a_valid_response: true } as unknown as ProviderResponse;
    }
    return {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: { kind: this.kind, name: this.id, model: this.id },
      model: this.id,
      text: step.text ?? `${this.id}:ok`,
      finish_reason: "stop",
      usage: { contract_version: "1.0.0", input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    };
  }
}

export interface HarnessRunResult {
  scenario: HarnessScenarioId;
  contract_ok: boolean;
  last_error: string | null;
  attempts_observed: number;
}

/**
 * Standardized provider scenarios for contract parity checks (deterministic, no network).
 */
export class ProviderHarness {
  private readonly validators = createContractValidators();

  getScenario(id: HarnessScenarioId): HarnessScenario {
    return PROVIDER_SCENARIOS[id];
  }

  async runScenario(
    id: HarnessScenarioId,
    opts?: { adapterId?: string; chaos?: ChaosPlan },
  ): Promise<HarnessRunResult> {
    const scenario = this.getScenario(id);
    const adapterId = opts?.adapterId ?? "harness-mock";
    const registry = new ProviderRegistry();
    registry.register(
      new HarnessScriptedAdapter(adapterId, "openai_compatible", scenario),
    );
    const gateway = new ProviderGateway(this.validators, registry);
    const chaos = chaosInjectorFromPlan(opts?.chaos);

    let attempts = 0;
    let lastError: string | null = null;
    let contract_ok = false;

    const maxAttempts = Math.max(1, scenario.attempts.length);
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      attempts += 1;
      try {
        await chaos.preExecute(adapterId, attempt);
        const response = await gateway.execute(adapterId, scenario.request);
        this.validators.assertValidProviderResponse(response);
        contract_ok = true;
        lastError = null;
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : "unknown error";
        contract_ok = false;
      }
    }

    return {
      scenario: id,
      contract_ok,
      last_error: lastError,
      attempts_observed: attempts,
    };
  }
}
