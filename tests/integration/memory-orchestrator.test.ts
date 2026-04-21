import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createContractValidators, outcome } from "../../runtime/contracts/index.js";
import { MemoryOrchestrator } from "../../runtime/core/memory-orchestrator.js";
import { DEFAULT_MEMORY_POLICY } from "../../runtime/memory/base/memory.types.js";
import { FilePersistentMemoryStore } from "../../runtime/memory/persistence/file-memory.store.js";
import { InMemoryPersistentMemoryStore } from "../../runtime/memory/persistence/in-memory.store.js";
import { InMemorySessionStore } from "../../runtime/memory/session/session-store.js";
import { SessionManager } from "../../runtime/memory/session/session-manager.js";

test("memory orchestrator: disabled policy yields valid memory_context", async () => {
  const v = createContractValidators();
  const sessions = new SessionManager(new InMemorySessionStore());
  const orch = new MemoryOrchestrator(v, sessions);
  const { memory_context, observation } = await orch.buildMemoryContext({
    session_id: "s-disabled",
    policy: { enable_session_state: false, enable_persistent_memory: false },
  });
  assert.equal(outcome(v.validateMemoryContext, memory_context).ok, true);
  assert.ok(String(observation.warnings[0]).includes("disabled"));
});

test("memory orchestrator: session continuity across calls", async () => {
  const v = createContractValidators();
  const sessions = new SessionManager(new InMemorySessionStore());
  const orch = new MemoryOrchestrator(v, sessions);
  await orch.buildMemoryContext({
    session_id: "s-cont",
    policy: { enable_session_state: true, enable_persistent_memory: false, max_recent_turns: 4 },
    ensure_session: true,
  });
  sessions.appendTurn("s-cont", {
    turn_id: "u1",
    at_ms: 10,
    role: "user",
    text: "first",
  });
  const { memory_context } = await orch.buildMemoryContext({
    session_id: "s-cont",
    policy: { enable_session_state: true, enable_persistent_memory: false, max_recent_turns: 4 },
  });
  assert.equal(outcome(v.validateMemoryContext, memory_context).ok, true);
  const entries = (memory_context as { entries?: { text?: string }[] }).entries ?? [];
  assert.ok(entries.some((e) => e.text === "first"));
});

test("memory orchestrator: persistent opt-in + explicit persist", async () => {
  const v = createContractValidators();
  const sessions = new SessionManager(new InMemorySessionStore());
  const store = new InMemoryPersistentMemoryStore();
  const orch = new MemoryOrchestrator(v, sessions, store);
  await orch.persistEntry({
    policy: {
      ...DEFAULT_MEMORY_POLICY,
      enable_persistent_memory: true,
      persistence_namespace: "ns",
    },
    entry: { id: "fact-1", role: "system", text: "pinned fact" },
  });
  const { memory_context } = await orch.buildMemoryContext({
    session_id: "s-persist",
    policy: {
      enable_session_state: false,
      enable_persistent_memory: true,
      persistence_namespace: "ns",
      max_memory_entries: 5,
    },
  });
  const entries = (memory_context as { entries?: { id?: string }[] }).entries ?? [];
  assert.ok(entries.some((e) => e.id === "fact-1"));
});

test("memory orchestrator: buildMemoryContext does not implicitly persist", async () => {
  const v = createContractValidators();
  const sessions = new SessionManager(new InMemorySessionStore());
  const store = new InMemoryPersistentMemoryStore();
  const orch = new MemoryOrchestrator(v, sessions, store);
  const policy = {
    ...DEFAULT_MEMORY_POLICY,
    enable_session_state: false,
    enable_persistent_memory: true,
    persistence_namespace: "ns2",
    auto_persist: false,
  };
  const before = await store.listEntries("ns2", 100);
  await orch.buildMemoryContext({
    session_id: "s-nopersist",
    policy,
    ensure_session: true,
  });
  const after = await store.listEntries("ns2", 100);
  assert.equal(after.length, before.length);
});

test("file memory store: writes only under configured directory", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zayden-mem-"));
  try {
    const store = new FilePersistentMemoryStore(dir);
    await store.saveEntry("ns", { id: "f1", role: "user", text: "file-store" });
    const list = await store.listEntries("ns", 10);
    assert.equal(list.length, 1);
    assert.equal(list[0]?.text, "file-store");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
