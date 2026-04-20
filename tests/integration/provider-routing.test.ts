import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators, type ProviderRequest, type ProviderResponse } from "../../runtime/contracts/index.js";
import { RuntimeOrchestrator } from "../../runtime/core/runtime-orchestrator.js";
import { ProviderExecutionError } from "../../runtime/providers/base/provider.errors.js";
import type { ProviderAdapter } from "../../runtime/providers/base/provider.interface.js";
import type { ProviderKind } from "../../runtime/providers/base/provider.types.js";
import { ProviderGateway, ProviderRegistry } from "../../runtime/providers/registry/provider-registry.js";

class TestAdapter implements ProviderAdapter {
  constructor(
    readonly id: string,
    readonly kind: ProviderKind,
    private readonly opts: {
      available?: boolean;
      text?: string;
      fail?: boolean;
      recoverable?: boolean;
    } = {},
  ) {}

  async isAvailable(): Promise<boolean> {
    return this.opts.available ?? true;
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
      provider_actual: {
        kind: this.kind,
        name: this.id,
        model: this.id,
      },
      model: this.id,
      text: this.opts.text ?? `${this.id}:ok`,
      finish_reason: "stop",
      usage: { contract_version: "1.0.0", input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  }
}

function request(): ProviderRequest {
  return {
    contract_version: "1.0.0",
    correlation_id: "corr-routing-0001",
    session_id: "sess-routing",
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

test("route-to-local (LOCAL_ONLY local success path)", async () => {
  const orchestrator = makeOrchestrator([
    new TestAdapter("local-a", "local_gguf", { text: "local-ok" }),
    new TestAdapter("cloud-a", "openai_compatible", { text: "cloud-ok" }),
  ]);

  const result = await orchestrator.route({
    request: request(),
    requested_mode: "LOCAL_ONLY",
    policy: { preferred_local_provider: "local-a" },
  });
  assert.equal(result.error, null);
  assert.equal(result.response?.text, "local-ok");
  assert.equal(result.provider_actual?.name, "local-a");
});

test("route-to-cloud (CLOUD_ONLY cloud success path)", async () => {
  const orchestrator = makeOrchestrator([
    new TestAdapter("local-a", "local_gguf"),
    new TestAdapter("cloud-a", "openai_compatible", { text: "cloud-only-ok" }),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "CLOUD_ONLY",
    policy: { preferred_cloud_provider: "cloud-a" },
  });
  assert.equal(result.error, null);
  assert.equal(result.provider_actual?.name, "cloud-a");
});

test("local-fails-cloud-recovers (HYBRID fallback success)", async () => {
  const orchestrator = makeOrchestrator([
    new TestAdapter("local-a", "local_gguf", { fail: true, recoverable: true }),
    new TestAdapter("cloud-a", "openai_compatible", { text: "cloud-recovered" }),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "HYBRID",
    policy: {
      preferred_local_provider: "local-a",
      preferred_cloud_provider: "cloud-a",
      allow_fallback: true,
      fallback_order: ["cloud-a"],
    },
  });
  assert.equal(result.error, null);
  assert.equal(result.response?.text, "cloud-recovered");
  assert.equal(result.observability.fallback_triggered, true);
  assert.equal(result.fallback_reason?.did_fallback, true);
});

test("local unavailable + LOCAL_ONLY fails deterministically", async () => {
  const orchestrator = makeOrchestrator([
    new TestAdapter("local-a", "local_gguf", { available: false }),
    new TestAdapter("cloud-a", "openai_compatible"),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "LOCAL_ONLY",
    policy: {
      preferred_local_provider: "local-a",
      strict_local_only: true,
      allow_fallback: true,
      fallback_order: ["cloud-a"],
    },
  });
  assert.notEqual(result.error, null);
  assert.equal(result.error?.error_type, "NO_PROVIDER_AVAILABLE");
});

test("requested provider unavailable + fallback policy applied", async () => {
  const orchestrator = makeOrchestrator([
    new TestAdapter("local-a", "local_gguf", { available: false }),
    new TestAdapter("cloud-a", "openai_compatible", { text: "cloud-from-request-fallback" }),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "HYBRID",
    requested_provider: "local-a",
    policy: {
      allow_fallback: true,
      fallback_order: ["cloud-a"],
    },
  });
  assert.equal(result.error, null);
  assert.equal(result.provider_actual?.name, "cloud-a");
  assert.equal(result.observability.provider_chain[0]?.name, "local-a");
});

test("fallback disabled -> fail deterministically", async () => {
  const orchestrator = makeOrchestrator([
    new TestAdapter("local-a", "local_gguf", { fail: true, recoverable: true }),
    new TestAdapter("cloud-a", "openai_compatible", { text: "should-not-run" }),
  ]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "HYBRID",
    policy: {
      preferred_local_provider: "local-a",
      allow_fallback: false,
      fallback_order: ["cloud-a"],
    },
  });
  assert.notEqual(result.error, null);
  assert.equal(result.error?.error_type, "FALLBACK_NOT_ALLOWED");
});

test("cloud-fails-safe-fallback and provider_chain is observable", async () => {
  const orchestrator = makeOrchestrator([
    new TestAdapter("cloud-a", "openai_compatible", { fail: true, recoverable: true }),
    new TestAdapter("local-a", "local_gguf", { text: "safe-local" }),
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
  assert.ok(result.observability.provider_chain.length >= 2);
  assert.equal(result.observability.provider_chain[0]?.name, "cloud-a");
  assert.equal(result.observability.provider_chain[1]?.name, "local-a");
  assert.equal(result.fallback_reason?.did_fallback, true);
});

test("unsupported-provider error path", async () => {
  const orchestrator = makeOrchestrator([new TestAdapter("local-a", "local_gguf")]);
  const result = await orchestrator.route({
    request: request(),
    requested_mode: "HYBRID",
    requested_provider: "does-not-exist",
  });
  assert.notEqual(result.error, null);
  assert.equal(result.error?.error_type, "NO_PROVIDER_AVAILABLE");
});
