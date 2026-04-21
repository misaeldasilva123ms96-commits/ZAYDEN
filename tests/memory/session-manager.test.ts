import assert from "node:assert/strict";
import test from "node:test";

import { MemorySessionError } from "../../runtime/memory/base/memory.errors.js";
import { InMemorySessionStore } from "../../runtime/memory/session/session-store.js";
import { SessionManager } from "../../runtime/memory/session/session-manager.js";

test("session manager: create, get, append, update, clear", () => {
  const store = new InMemorySessionStore();
  const mgr = new SessionManager(store);
  const s0 = mgr.createSession("sess-a", 1000);
  assert.equal(s0.session_id, "sess-a");
  mgr.appendTurn(
    "sess-a",
    { turn_id: "t1", at_ms: 1001, role: "user", text: "hi" },
    1001,
  );
  const s1 = mgr.getSession("sess-a");
  assert.equal(s1?.recent_turns.length, 1);
  mgr.updateSession(
    "sess-a",
    { tool_execution_summary: ["echo ok"] },
    1002,
  );
  assert.deepEqual(mgr.getSession("sess-a")?.tool_execution_summary, ["echo ok"]);
  mgr.clearSession("sess-a");
  assert.equal(mgr.getSession("sess-a"), undefined);
});

test("session manager: update rejects malformed patch", () => {
  const store = new InMemorySessionStore();
  const mgr = new SessionManager(store);
  mgr.createSession("sess-b", 1);
  assert.throws(
    () =>
      mgr.updateSession("sess-b", {
        tool_execution_summary: [1, 2] as unknown as string[],
      }),
    MemorySessionError,
  );
});

test("session manager: get missing throws on update", () => {
  const store = new InMemorySessionStore();
  const mgr = new SessionManager(store);
  assert.throws(() => mgr.updateSession("nope", { runtime_summary: [] }), MemorySessionError);
});
