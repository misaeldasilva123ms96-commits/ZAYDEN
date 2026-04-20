import assert from "node:assert/strict";
import test from "node:test";

import { createContractValidators, outcome } from "../../runtime/contracts/index.js";

function validError() {
  return {
    contract_version: "1.0.0" as const,
    error_type: "PROVIDER_TIMEOUT",
    message: "upstream timed out",
    origin: "provider" as const,
    recoverable: true,
    metadata: { correlation_id: "c1" },
  };
}

test("error envelope: valid passes", () => {
  const v = createContractValidators();
  assert.equal(outcome(v.validateErrorEnvelope, validError()).ok, true);
});

test("error envelope: invalid origin enum fails", () => {
  const v = createContractValidators();
  const bad = { ...validError(), origin: "network" };
  assert.equal(outcome(v.validateErrorEnvelope, bad).ok, false);
});

test("error envelope: missing message fails", () => {
  const v = createContractValidators();
  const bad = { ...validError() };
  Reflect.deleteProperty(bad as object, "message");
  assert.equal(outcome(v.validateErrorEnvelope, bad).ok, false);
});

test("error envelope: JSON roundtrip", () => {
  const v = createContractValidators();
  const o = validError();
  const round = JSON.parse(JSON.stringify(o)) as unknown;
  assert.equal(outcome(v.validateErrorEnvelope, round).ok, true);
});
