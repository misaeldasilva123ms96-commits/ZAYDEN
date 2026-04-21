import assert from "node:assert/strict";
import test from "node:test";

import { MemorySessionError } from "../../runtime/memory/base/memory.errors.js";
import { resolveMemoryPolicy } from "../../runtime/memory/policy/memory-policy.js";

test("resolveMemoryPolicy merges defaults", () => {
  const p = resolveMemoryPolicy({ max_recent_turns: 3 });
  assert.equal(p.max_recent_turns, 3);
  assert.equal(p.enable_persistent_memory, false);
});

test("resolveMemoryPolicy rejects negative limits", () => {
  assert.throws(() => resolveMemoryPolicy({ max_recent_turns: -1 }), MemorySessionError);
});
