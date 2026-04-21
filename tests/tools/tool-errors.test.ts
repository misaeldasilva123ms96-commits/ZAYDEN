import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators, outcome } from "../../runtime/contracts/index.js";
import {
  normalizeToolResultToResultField,
  toolFailureToErrorEnvelope,
} from "../../runtime/tools/execution/tool-result-normalizer.js";

test("toolFailureToErrorEnvelope matches error-envelope schema", () => {
  const v = createContractValidators();
  const env = toolFailureToErrorEnvelope({
    error_type: "TOOL_UNIT_TEST",
    message: "unit test message",
    recoverable: false,
    metadata: { x: 1 },
  });
  assert.equal(outcome(v.validateErrorEnvelope, env).ok, true);
});

test("normalizeToolResultToResultField: error branch embeds valid envelope", () => {
  const v = createContractValidators();
  const field = normalizeToolResultToResultField({
    ok: false,
    code: "TOOL_FAIL",
    message: "failed",
    recoverable: true,
    metadata: {},
  });
  assert.equal(field.kind, "tool_error");
  const inner = field.error as Record<string, unknown>;
  assert.equal(outcome(v.validateErrorEnvelope, inner).ok, true);
});
