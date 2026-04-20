import assert from "node:assert/strict";
import test from "node:test";

import { resolveRoutingPolicy } from "../../runtime/providers/routing/routing-policy.js";
import { selectProviderOrder } from "../../runtime/providers/routing/provider-selection.js";

const catalog = [
  { id: "local-a", kind: "local_gguf" as const, available: true },
  { id: "cloud-a", kind: "openai_compatible" as const, available: true },
  { id: "local-b", kind: "local_gguf" as const, available: false },
];

test("LOCAL_ONLY selects local provider", () => {
  const policy = resolveRoutingPolicy({ preferred_local_provider: "local-a" });
  const plan = selectProviderOrder({
    catalog,
    mode: "LOCAL_ONLY",
    requestedProvider: null,
    policy,
  });
  assert.ok(!("code" in plan));
  assert.equal(plan.selectedOrder[0], "local-a");
});

test("CLOUD_ONLY rejects local requested provider", () => {
  const policy = resolveRoutingPolicy();
  const plan = selectProviderOrder({
    catalog,
    mode: "CLOUD_ONLY",
    requestedProvider: "local-a",
    policy,
  });
  assert.ok("code" in plan);
  if ("code" in plan) {
    assert.equal(plan.code, "INVALID_PROVIDER_FOR_MODE");
  }
});

test("HYBRID chooses preferred provider", () => {
  const policy = resolveRoutingPolicy({
    hybrid_preference: "cloud_first",
    preferred_cloud_provider: "cloud-a",
  });
  const plan = selectProviderOrder({
    catalog,
    mode: "HYBRID",
    requestedProvider: null,
    policy,
  });
  assert.ok(!("code" in plan));
  assert.equal(plan.selectedOrder[0], "cloud-a");
});

test("fallback ordering respects declarative policy", () => {
  const policy = resolveRoutingPolicy({
    preferred_local_provider: "local-a",
    fallback_order: ["cloud-a", "local-b"],
  });
  const plan = selectProviderOrder({
    catalog,
    mode: "HYBRID",
    requestedProvider: null,
    policy,
  });
  assert.ok(!("code" in plan));
  assert.deepEqual(plan.selectedOrder.slice(0, 3), ["local-a", "cloud-a", "local-b"]);
});

test("invalid requested_provider is rejected deterministically", () => {
  const policy = resolveRoutingPolicy();
  const plan = selectProviderOrder({
    catalog,
    mode: "HYBRID",
    requestedProvider: "missing-id",
    policy,
  });
  assert.ok("code" in plan);
  if ("code" in plan) {
    assert.equal(plan.code, "NO_PROVIDER_AVAILABLE");
  }
});
