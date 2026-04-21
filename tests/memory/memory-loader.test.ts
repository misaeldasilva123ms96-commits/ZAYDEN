import assert from "node:assert/strict";
import test from "node:test";

import { MemorySessionError } from "../../runtime/memory/base/memory.errors.js";
import { DEFAULT_MEMORY_POLICY, type MemoryPolicy } from "../../runtime/memory/base/memory.types.js";
import { loadPersistentEntries } from "../../runtime/memory/loading/memory-loader.js";
import { InMemoryPersistentMemoryStore } from "../../runtime/memory/persistence/in-memory.store.js";

test("loadPersistentEntries: disabled policy returns empty", async () => {
  const policy: MemoryPolicy = { ...DEFAULT_MEMORY_POLICY, enable_persistent_memory: false };
  const out = await loadPersistentEntries(undefined, policy);
  assert.deepEqual(out, []);
});

test("loadPersistentEntries: enabled without store throws", async () => {
  const policy: MemoryPolicy = {
    ...DEFAULT_MEMORY_POLICY,
    enable_persistent_memory: true,
    persistence_namespace: "ns",
  };
  await assert.rejects(loadPersistentEntries(undefined, policy), MemorySessionError);
});

test("loadPersistentEntries: loads sorted slice", async () => {
  const store = new InMemoryPersistentMemoryStore();
  const policy: MemoryPolicy = {
    ...DEFAULT_MEMORY_POLICY,
    enable_persistent_memory: true,
    persistence_namespace: "ns",
    max_memory_entries: 10,
  };
  await store.saveEntry("ns", { id: "b", role: "system", text: "B" });
  await store.saveEntry("ns", { id: "a", role: "system", text: "A" });
  const out = await loadPersistentEntries(store, policy);
  assert.equal(out.length, 2);
  assert.equal(out[0]?.id, "a");
});
