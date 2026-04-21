import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators, type ProviderRequest, type ProviderResponse } from "../../runtime/contracts/index.js";
import { RuntimeOrchestrator } from "../../runtime/core/runtime-orchestrator.js";
import {
  ProviderExecutionError,
  ProviderUnavailableError,
} from "../../runtime/providers/base/provider.errors.js";
import type { ProviderAdapter } from "../../runtime/providers/base/provider.interface.js";
import type { ProviderKind } from "../../runtime/providers/base/provider.types.js";
import { ProviderGateway, ProviderRegistry } from "../../runtime/providers/registry/provider-registry.js";

class DelayAdapter implements ProviderAdapter {
  constructor(
    readonly id: string,
    readonly kind: ProviderKind,
    private readonly delayMs: number,
    private readonly text: string,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    await new Promise((r) => setTimeout(r, this.delayMs));
    return {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: { kind: this.kind, name: this.id, model: this.id },
      model: this.id,
      text: this.text,
      finish_reason: "stop",
      usage: { contract_version: "1.0.0", input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  }
}

class MalformedAdapter implements ProviderAdapter {
  constructor(readonly id: string, readonly kind: ProviderKind) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(_request: ProviderRequest): Promise<ProviderResponse> {
    return { not_a_contract: true } as unknown as ProviderResponse;
  }
}

function request(): ProviderRequest {
  return {
    contract_version: "1.0.0",
    correlation_id: "corr-chaos-0001",
    session_id: "sess-chaos",
    payload: { messages: [{ role: "user", content: "hello" }] },
    parameters: {},
  };
}

function makeOrchestrator(adapters: ProviderAdapter[]) {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  for (const a of adapters) registry.register(a);
  const gateway = new ProviderGateway(validators, registry);
  return new RuntimeOrchestrator(validators, gateway, registry);
}

test("HYBRID: slow local exceeds per-attempt timeout then deterministic cloud fallback", async () => {
  const orchestrator = makeOrchestrator([
    new DelayAdapter("local-a", "local_gguf", 80, "slow-local"),
    new DelayAdapter("cloud-a", "openai_compatible", 0, "cloud-fast"),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "HYBRID",
    environment_profile: "testing",
    policy: {
      preferred_local_provider: "local-a",
      preferred_cloud_provider: "cloud-a",
      allow_fallback: true,
      fallback_order: ["cloud-a"],
      timeout_policy: { per_attempt_ms: 15, total_ms: 5_000 },
      retry_policy: { max_attempts: 1, retry_delay_ms: 0, retry_on: [] },
    },
  });
  assert.equal(result.error, null);
  assert.equal(result.response?.text, "cloud-fast");
  assert.equal(result.observability.fallback_triggered, true);
  assert.equal(result.resilience?.timeout_triggered, true);
});

test("HYBRID: chaos forced failure on primary then explicit fallback", async () => {
  const orchestrator = makeOrchestrator([
    new DelayAdapter("local-a", "local_gguf", 0, "unused"),
    new DelayAdapter("cloud-a", "openai_compatible", 0, "cloud-after-chaos"),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "HYBRID",
    policy: {
      preferred_local_provider: "local-a",
      preferred_cloud_provider: "cloud-a",
      allow_fallback: true,
      fallback_order: ["cloud-a"],
      timeout_policy: { per_attempt_ms: 5_000, total_ms: 15_000 },
      retry_policy: { max_attempts: 1, retry_delay_ms: 0, retry_on: [] },
    },
    simulation: {
      chaos: {
        enabled: true,
        schedule: {
          "local-a@0": { force_failure: "NETWORK_ERROR" },
        },
      },
    },
  });
  assert.equal(result.error, null);
  assert.equal(result.provider_actual?.name, "cloud-a");
  assert.equal(result.resilience?.chaos_applied, true);
});

test("HYBRID: malformed local response is rejected then fallback succeeds", async () => {
  const orchestrator = makeOrchestrator([
    new MalformedAdapter("local-a", "local_gguf"),
    new DelayAdapter("cloud-a", "openai_compatible", 0, "cloud-ok"),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "HYBRID",
    policy: {
      preferred_local_provider: "local-a",
      preferred_cloud_provider: "cloud-a",
      allow_fallback: true,
      fallback_order: ["cloud-a"],
      timeout_policy: { per_attempt_ms: 5_000, total_ms: 15_000 },
      retry_policy: { max_attempts: 1, retry_delay_ms: 0, retry_on: [] },
    },
  });
  assert.equal(result.error, null);
  assert.equal(result.response?.text, "cloud-ok");
  assert.equal(result.resilience?.failure_type, null);
});

class TrivialAdapter implements ProviderAdapter {
  constructor(
    readonly id: string,
    readonly kind: ProviderKind,
    private readonly opts: { fail?: boolean; recoverable?: boolean; text?: string } = {},
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    if (this.opts.fail) {
      throw new ProviderExecutionError({
        contract_version: "1.0.0",
        error_type: "PROVIDER_EXECUTION_ERROR",
        message: `${this.id} failed`,
        origin: "provider",
        recoverable: this.opts.recoverable ?? true,
        metadata: { adapter: this.id },
      });
    }
    return {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: { kind: this.kind, name: this.id, model: this.id },
      model: this.id,
      text: this.opts.text ?? `${this.id}:ok`,
      finish_reason: "stop",
      usage: { contract_version: "1.0.0", input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  }
}

class FlakyAdapter implements ProviderAdapter {
  private n = 0;

  constructor(readonly id: string, readonly kind: ProviderKind) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(request: ProviderRequest): Promise<ProviderResponse> {
    this.n += 1;
    if (this.n === 1) {
      throw new ProviderUnavailableError(this.id, "transient");
    }
    return {
      contract_version: "1.0.0",
      correlation_id: request.correlation_id,
      session_id: request.session_id,
      provider_actual: { kind: this.kind, name: this.id, model: this.id },
      model: this.id,
      text: "recovered-after-retry",
      finish_reason: "stop",
      usage: { contract_version: "1.0.0", input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  }
}

test("LOCAL_ONLY: retry on recoverable network error without changing routing order", async () => {
  const orchestrator = makeOrchestrator([new FlakyAdapter("local-a", "local_gguf")]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "LOCAL_ONLY",
    policy: {
      preferred_local_provider: "local-a",
      strict_local_only: true,
      timeout_policy: { per_attempt_ms: 5_000, total_ms: 15_000 },
      retry_policy: {
        max_attempts: 2,
        retry_delay_ms: 0,
        retry_on: ["NETWORK_ERROR"],
      },
    },
  });
  assert.equal(result.error, null);
  assert.equal(result.response?.text, "recovered-after-retry");
  assert.ok((result.resilience?.retry_count ?? 0) >= 1);
});

test("SAFE_FALLBACK remains deterministic without chaos", async () => {
  const orchestrator = makeOrchestrator([
    new TrivialAdapter("cloud-a", "openai_compatible", { fail: true, recoverable: true }),
    new TrivialAdapter("local-a", "local_gguf", { text: "safe-local" }),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "SAFE_FALLBACK",
    policy: {
      preferred_cloud_provider: "cloud-a",
      fallback_order: ["local-a"],
      allow_fallback: true,
      hybrid_preference: "cloud_first",
    },
  });
  assert.equal(result.error, null);
  assert.equal(result.response?.text, "safe-local");
  assert.equal(result.resilience?.chaos_applied, false);
});
