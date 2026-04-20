import assert from "node:assert/strict";
import test from "node:test";

import {
  CHAT_REQUEST_REQUIRED_TOP_LEVEL,
  CHAT_RESPONSE_REQUIRED_TOP_LEVEL,
  CONTRACT_STABILITY_FINGERPRINT,
  createContractValidators,
  outcome,
} from "../../runtime/contracts/index.js";

function validMemoryContext() {
  return { contract_version: "1.0.0" as const };
}

function validRuntimeInspection() {
  return {
    contract_version: "1.0.0" as const,
    runtime_mode: "HYBRID" as const,
    execution_path: ["POLICY_CHECK", "ROUTE"],
    provider_chain: [{ name: "stub", kind: "unknown" as const }],
    fallback_triggered: false,
    tool_execution_count: 0,
    latency_ms: 1,
    warnings: [],
  };
}

function validChatRequest() {
  return {
    contract_version: "1.0.0" as const,
    session_id: "sess-1",
    input: "hello",
    system_policy: { contract_version: "1.0.0" as const },
    tool_policy: {
      contract_version: "1.0.0" as const,
      allow_tools: true,
      allowed_tool_names: ["read_file"],
    },
    memory_context: validMemoryContext(),
    requested_mode: "HYBRID" as const,
    requested_provider: null,
    metadata: { contract_version: "1.0.0" as const, trace_id: "t-1" },
  };
}

function validToolCall() {
  return {
    contract_version: "1.0.0" as const,
    tool_call_id: "tc-1",
    tool_name: "read_file",
    arguments: { path: "README.md" },
    status: "pending" as const,
  };
}

function validChatResponse() {
  return {
    contract_version: "1.0.0" as const,
    session_id: "sess-1",
    output: "world",
    runtime_mode: "HYBRID" as const,
    provider_requested: "ollama",
    provider_actual: {
      kind: "ollama" as const,
      name: "local",
      model: "stub",
    },
    model: "stub",
    fallback_reason: null,
    tool_calls: [validToolCall()],
    observability: validRuntimeInspection(),
    usage: {
      contract_version: "1.0.0" as const,
      input_tokens: 1,
      output_tokens: 2,
      total_tokens: 3,
      provider_usage: {},
    },
    error: null,
  };
}

test("chat request: valid payload passes", () => {
  const v = createContractValidators();
  const res = outcome(v.validateChatRequest, validChatRequest());
  assert.equal(res.ok, true);
});

test("chat request: missing required field fails", () => {
  const v = createContractValidators();
  const bad = { ...validChatRequest(), session_id: undefined };
  Reflect.deleteProperty(bad as object, "session_id");
  const res = outcome(v.validateChatRequest, bad);
  assert.equal(res.ok, false);
});

test("chat request: invalid enum fails", () => {
  const v = createContractValidators();
  const bad = { ...validChatRequest(), requested_mode: "NOT_A_MODE" };
  const res = outcome(v.validateChatRequest, bad);
  assert.equal(res.ok, false);
});

test("chat request: malformed structure fails", () => {
  const v = createContractValidators();
  const res = outcome(v.validateChatRequest, "not-an-object");
  assert.equal(res.ok, false);
});

test("chat request: JSON roundtrip preserves validity", () => {
  const v = createContractValidators();
  const original = validChatRequest();
  const round = JSON.parse(JSON.stringify(original)) as unknown;
  const first = outcome(v.validateChatRequest, original);
  const second = outcome(v.validateChatRequest, round);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
});

test("chat response: valid payload passes", () => {
  const v = createContractValidators();
  const res = outcome(v.validateChatResponse, validChatResponse());
  assert.equal(res.ok, true);
});

test("chat response: JSON roundtrip preserves validity", () => {
  const v = createContractValidators();
  const original = validChatResponse();
  const round = JSON.parse(JSON.stringify(original)) as unknown;
  assert.equal(outcome(v.validateChatResponse, original).ok, true);
  assert.equal(outcome(v.validateChatResponse, round).ok, true);
});

test("stability: fingerprint and required field sets are pinned", () => {
  assert.equal(CONTRACT_STABILITY_FINGERPRINT, "zayden.runtime.contracts@v1.0.0");
  assert.deepEqual([...CHAT_REQUEST_REQUIRED_TOP_LEVEL], [
    "contract_version",
    "session_id",
    "input",
    "system_policy",
    "tool_policy",
    "memory_context",
    "requested_mode",
    "metadata",
  ]);
  assert.deepEqual([...CHAT_RESPONSE_REQUIRED_TOP_LEVEL], [
    "contract_version",
    "session_id",
    "output",
    "runtime_mode",
    "provider_requested",
    "provider_actual",
    "model",
    "fallback_reason",
    "tool_calls",
    "observability",
    "usage",
    "error",
  ]);
});
