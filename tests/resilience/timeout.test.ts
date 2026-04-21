import assert from "node:assert/strict";
import test from "node:test";

import { ZaydenTimeoutError, withTimeout } from "../../runtime/providers/resilience/timeout-controller.js";

test("withTimeout resolves when work finishes within budget", async () => {
  const v = await withTimeout(async () => "ok", 200);
  assert.equal(v, "ok");
});

test("withTimeout rejects with ZaydenTimeoutError when work exceeds budget", async () => {
  await assert.rejects(
    withTimeout(async () => {
      await new Promise((r) => setTimeout(r, 80));
      return "late";
    }, 20),
    (e) => e instanceof ZaydenTimeoutError,
  );
});

test("withTimeout passes through when timeout_ms is non-positive", async () => {
  const v = await withTimeout(async () => "instant", 0);
  assert.equal(v, "instant");
});
