import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators, outcome } from "../../runtime/contracts/index.js";

function validProviderRequest() {
  return {
    contract_version: "1.0.0" as const,
    correlation_id: "corr-12345678",
    session_id: "sess-1",
    provider_hint: null,
    payload: {
      messages: [{ role: "user" as const, content: "hi" }],
    },
    parameters: { temperature: 0.2, max_output_tokens: 256 },
  };
}

function validProviderResponse() {
  return {
    contract_version: "1.0.0" as const,
    correlation_id: "corr-12345678",
    session_id: "sess-1",
    provider_actual: {
      kind: "openai_compatible" as const,
      name: "stub",
      model: "stub-model",
    },
    model: "stub-model",
    text: "hello",
    finish_reason: "stop",
    usage: {
      contract_version: "1.0.0" as const,
      input_tokens: 3,
      output_tokens: 4,
      total_tokens: 7,
      provider_usage: { tier: "test" },
    },
  };
}

test("provider request: valid passes", () => {
  const v = createContractValidators();
  assert.equal(outcome(v.validateProviderRequest, validProviderRequest()).ok, true);
});

test("provider request: missing correlation_id fails", () => {
  const v = createContractValidators();
  const bad = { ...validProviderRequest() };
  Reflect.deleteProperty(bad as object, "correlation_id");
  assert.equal(outcome(v.validateProviderRequest, bad).ok, false);
});

test("provider request: JSON roundtrip", () => {
  const v = createContractValidators();
  const o = validProviderRequest();
  const round = JSON.parse(JSON.stringify(o)) as unknown;
  assert.equal(outcome(v.validateProviderRequest, round).ok, true);
});

test("provider response: valid passes", () => {
  const v = createContractValidators();
  assert.equal(outcome(v.validateProviderResponse, validProviderResponse()).ok, true);
});

test("provider response: malformed payload fails", () => {
  const v = createContractValidators();
  assert.equal(outcome(v.validateProviderResponse, { not: "even close" }).ok, false);
});
