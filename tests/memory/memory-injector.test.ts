import assert from "node:assert/strict";
import test from "node:test";

import type { MemoryContextEntry } from "../../runtime/memory/base/memory.types.js";
import { enforceContextBudget } from "../../runtime/memory/policy/context-budget.js";
import { injectWithBudget } from "../../runtime/memory/loading/memory-injector.js";

test("enforceContextBudget: drops oldest first", () => {
  const entries: MemoryContextEntry[] = [
    { id: "a", role: "user", text: "aaaa" },
    { id: "b", role: "user", text: "bbbb" },
  ];
  const r = enforceContextBudget({ entries, max_tokens: 2 });
  assert.equal(r.entries.length, 1);
  assert.equal(r.entries[0]?.id, "b");
  assert.equal(r.trimmed, true);
});

test("injectWithBudget: merges observation warnings", () => {
  const candidates: MemoryContextEntry[] = [{ id: "x", role: "user", text: "hello" }];
  const { observation } = injectWithBudget({
    candidates,
    max_context_tokens_estimate: 10_000,
    base: {
      session_id: "s",
      session_found: true,
      session_created: false,
      recent_turn_count_used: 1,
      persistent_entries_used: 0,
      persistence_enabled: false,
    },
    initialWarnings: ["seed"],
  });
  assert.ok(observation.warnings.includes("seed"));
});
