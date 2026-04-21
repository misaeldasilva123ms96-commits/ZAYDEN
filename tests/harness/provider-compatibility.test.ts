import assert from "node:assert/strict";
import test from "node:test";

import type { ChaosPlan } from "../../runtime/providers/routing/routing-types.js";
import { ProviderHarness } from "../../runtime/providers/harness/provider-harness.js";

test("harness: happy_path passes contract validation", async () => {
  const harness = new ProviderHarness();
  const r = await harness.runScenario("happy_path");
  assert.equal(r.contract_ok, true);
  assert.equal(r.last_error, null);
});

test("harness: invalid_payload fails contract deterministically", async () => {
  const harness = new ProviderHarness();
  const r = await harness.runScenario("invalid_payload");
  assert.equal(r.contract_ok, false);
  assert.notEqual(r.last_error, null);
});

test("harness: intermittent_failure recovers on second attempt", async () => {
  const harness = new ProviderHarness();
  const r = await harness.runScenario("intermittent_failure");
  assert.equal(r.contract_ok, true);
  assert.ok(r.attempts_observed >= 2);
});

test("harness: chaos schedule is deterministic and observable", async () => {
  const harness = new ProviderHarness();
  const chaos: ChaosPlan = {
    enabled: true,
    schedule: {
      "harness-mock@0": { latency_ms: 1 },
    },
  };
  const r = await harness.runScenario("happy_path", { chaos });
  assert.equal(r.contract_ok, true);
});
