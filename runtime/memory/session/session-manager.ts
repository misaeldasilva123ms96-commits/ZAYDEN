import { MemorySessionError } from "../base/memory.errors.js";
import type { SessionPatch, SessionState, SessionTurn } from "../base/session.types.js";
import { createEmptySession, normalizeSessionPatch } from "./session-normalizer.js";
import type { SessionStore } from "./session-store.js";

const DEFAULT_TURN_CAP = 200;

export class SessionManager {
  constructor(
    private readonly store: SessionStore,
    private readonly turn_cap: number = DEFAULT_TURN_CAP,
  ) {}

  createSession(session_id: string, now_ms: number = Date.now()): SessionState {
    if (this.store.get(session_id)) {
      throw new MemorySessionError("SESSION_INVALID", "session already exists");
    }
    const s = createEmptySession(session_id, now_ms);
    this.store.put(session_id, s);
    return s;
  }

  getSession(session_id: string): SessionState | undefined {
    return this.store.get(session_id);
  }

  updateSession(session_id: string, patch: SessionPatch, now_ms: number = Date.now()): SessionState {
    const current = this.store.get(session_id);
    if (!current) {
      throw new MemorySessionError("SESSION_NOT_FOUND", `no session ${session_id}`);
    }
    const p = normalizeSessionPatch(patch);
    const next: SessionState = {
      ...current,
      updated_at_ms: now_ms,
      recent_turns: p.recent_turns ?? current.recent_turns,
      tool_execution_summary: p.tool_execution_summary ?? current.tool_execution_summary,
      runtime_summary: p.runtime_summary ?? current.runtime_summary,
    };
    this.store.put(session_id, next);
    return next;
  }

  appendTurn(session_id: string, turn: SessionTurn, now_ms: number = Date.now()): SessionState {
    normalizeSessionPatch({ recent_turns: [turn] });
    const current = this.store.get(session_id);
    if (!current) {
      throw new MemorySessionError("SESSION_NOT_FOUND", `no session ${session_id}`);
    }
    const turns = [...current.recent_turns, turn];
    const capped =
      turns.length > this.turn_cap ? turns.slice(turns.length - this.turn_cap) : turns;
    const next: SessionState = {
      ...current,
      updated_at_ms: now_ms,
      recent_turns: capped,
    };
    this.store.put(session_id, next);
    return next;
  }

  clearSession(session_id: string): void {
    this.store.delete(session_id);
  }
}
