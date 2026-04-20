import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators } from "../../runtime/contracts/index.js";
import { GemmaLocalAdapter } from "../../runtime/providers/adapters/local/gemma-local.adapter.js";
import { MockProviderAdapter } from "../../runtime/providers/adapters/mock/mock.adapter.js";
import {
  ProviderGateway,
  ProviderRegistry,
} from "../../runtime/providers/registry/provider-registry.js";
import {
  ProviderNotFoundError,
  ProviderUnavailableError,
} from "../../runtime/providers/base/provider.errors.js";

function minimalProviderRequest() {
  return {
    contract_version: "1.0.0" as const,
    correlation_id: "corr-abcdefgh",
    session_id: "sess-1",
    payload: {
      messages: [{ role: "user" as const, content: "ping" }],
    },
    parameters: {},
  };
}

test("gateway: mock adapter returns contract-valid response", async () => {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new MockProviderAdapter("mock"));
  const gateway = new ProviderGateway(validators, registry);
  const res = await gateway.execute("mock", minimalProviderRequest());
  assert.equal(res.text, "mock:ping");
  assert.equal(res.provider_actual.name, "mock");
});

test("gateway: invalid request throws before adapter", async () => {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new MockProviderAdapter("mock"));
  const gateway = new ProviderGateway(validators, registry);
  const bad = { ...minimalProviderRequest(), correlation_id: "short" };
  await assert.rejects(() => gateway.execute("mock", bad), /provider-request/);
});

test("gateway: unknown adapter id throws ProviderNotFoundError", async () => {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  const gateway = new ProviderGateway(validators, registry);
  await assert.rejects(
    () => gateway.execute("missing", minimalProviderRequest()),
    ProviderNotFoundError,
  );
});

test("gateway: gemma-local unavailable without asset paths", async () => {
  delete process.env.ZAYDEN_GGUF_ZIP_PATH;
  delete process.env.ZAYDEN_GGUF_PATH;
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new GemmaLocalAdapter());
  const gateway = new ProviderGateway(validators, registry);
  await assert.rejects(
    () => gateway.execute("gemma-local", minimalProviderRequest()),
    ProviderUnavailableError,
  );
});

test("gateway: JSON roundtrip on request preserves validity through gateway", async () => {
  const validators = createContractValidators();
  const registry = new ProviderRegistry();
  registry.register(new MockProviderAdapter("mock"));
  const gateway = new ProviderGateway(validators, registry);
  const req = minimalProviderRequest();
  const round = JSON.parse(JSON.stringify(req)) as unknown;
  const res = await gateway.execute("mock", round);
  assert.ok(res.text.startsWith("mock:"));
});
