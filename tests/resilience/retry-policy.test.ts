import assert from "node:assert/strict";
import test from "node:test";

import { computeRetryDecision, mergeRetryPolicy } from "../../runtime/providers/resilience/retry-policy.js";

test("computeRetryDecision retries only when failure class is listed and attempts remain", () => {
  const policy = mergeRetryPolicy(
    { max_attempts: 3, retry_delay_ms: 0, retry_on: ["TIMEOUT", "NETWORK_ERROR"] },
    {},
  );
  const r0 = computeRetryDecision({
    attemptIndex: 0,
    policy,
    failureClass: "TIMEOUT",
  });
  assert.equal(r0.will_retry, true);
  const r1 = computeRetryDecision({
    attemptIndex: 1,
    policy,
    failureClass: "TIMEOUT",
  });
  assert.equal(r1.will_retry, true);
  const r2 = computeRetryDecision({
    attemptIndex: 2,
    policy,
    failureClass: "TIMEOUT",
  });
  assert.equal(r2.will_retry, false);
});

test("computeRetryDecision does not retry non-retryable failure classes", () => {
  const policy = mergeRetryPolicy(
    { max_attempts: 3, retry_delay_ms: 0, retry_on: ["TIMEOUT"] },
    {},
  );
  const r = computeRetryDecision({
    attemptIndex: 0,
    policy,
    failureClass: "MALFORMED_RESPONSE",
  });
  assert.equal(r.will_retry, false);
});

test("computeRetryDecision does not retry NON_RECOVERABLE even if listed (retry_allowed false)", () => {
  const policy = mergeRetryPolicy(
    { max_attempts: 3, retry_delay_ms: 0, retry_on: ["NON_RECOVERABLE_ERROR"] },
    {},
  );
  const r = computeRetryDecision({
    attemptIndex: 0,
    policy,
    failureClass: "NON_RECOVERABLE_ERROR",
  });
  assert.equal(r.will_retry, false);
});
