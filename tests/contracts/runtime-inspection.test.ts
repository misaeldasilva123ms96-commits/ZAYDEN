import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators, outcome } from "../../runtime/contracts/index.js";

function validInspection() {
  return {
    contract_version: "1.0.0" as const,
    runtime_mode: "SAFE_FALLBACK" as const,
    execution_path: ["TRY_LOCAL", "FALLBACK_CLOUD"],
    provider_chain: [
      { name: "local", kind: "local_gguf" as const },
      { name: "cloud", kind: "openai_compatible" as const },
    ],
    fallback_triggered: true,
    tool_execution_count: 2,
    latency_ms: 120,
    warnings: ["degraded_mode"],
  };
}

test("runtime inspection: valid passes", () => {
  const v = createContractValidators();
  assert.equal(outcome(v.validateRuntimeInspection, validInspection()).ok, true);
});

test("runtime inspection: invalid runtime_mode fails", () => {
  const v = createContractValidators();
  const bad = { ...validInspection(), runtime_mode: "LOCAL" };
  assert.equal(outcome(v.validateRuntimeInspection, bad).ok, false);
});

test("runtime inspection: negative latency fails", () => {
  const v = createContractValidators();
  const bad = { ...validInspection(), latency_ms: -1 };
  assert.equal(outcome(v.validateRuntimeInspection, bad).ok, false);
});

test("runtime inspection: JSON roundtrip", () => {
  const v = createContractValidators();
  const o = validInspection();
  const round = JSON.parse(JSON.stringify(o)) as unknown;
  assert.equal(outcome(v.validateRuntimeInspection, round).ok, true);
});
