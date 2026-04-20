import assert from "node:assert/strict";
import test from "node:test";

import { buildFallbackOrder, shouldAttemptFallback } from "../../runtime/providers/routing/fallback-policy.js";
import { resolveRoutingPolicy } from "../../runtime/providers/routing/routing-policy.js";

test("LOCAL_ONLY strict mode does not fallback", () => {
  const policy = resolveRoutingPolicy({ strict_local_only: true, allow_fallback: true });
  const allowed = shouldAttemptFallback({
    mode: "LOCAL_ONLY",
    policy,
    attemptIndex: 0,
    hasAnotherCandidate: true,
    lastFailureRecoverable: true,
  });
  assert.equal(allowed, false);
});

test("HYBRID allows fallback when recoverable and fallback enabled", () => {
  const policy = resolveRoutingPolicy({ allow_fallback: true });
  const allowed = shouldAttemptFallback({
    mode: "HYBRID",
    policy,
    attemptIndex: 0,
    hasAnotherCandidate: true,
    lastFailureRecoverable: true,
  });
  assert.equal(allowed, true);
});

test("fallback requires recoverable failures", () => {
  const policy = resolveRoutingPolicy({ allow_fallback: true });
  const allowed = shouldAttemptFallback({
    mode: "SAFE_FALLBACK",
    policy,
    attemptIndex: 0,
    hasAnotherCandidate: true,
    lastFailureRecoverable: false,
  });
  assert.equal(allowed, false);
});

test("buildFallbackOrder keeps deterministic uniqueness", () => {
  const order = buildFallbackOrder({
    primaryId: "a",
    policyOrder: ["b", "a", "c"],
    modeCandidates: ["c", "d", "b"],
  });
  assert.deepEqual(order, ["a", "b", "c", "d"]);
});
