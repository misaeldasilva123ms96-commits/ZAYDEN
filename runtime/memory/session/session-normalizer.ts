import { MemorySessionError } from "../base/memory.errors.js";
import type { SessionPatch, SessionState, SessionTurn } from "../base/session.types.js";

function assertNonEmptySessionId(session_id: string): void {
  if (typeof session_id !== "string" || session_id.trim().length === 0) {
    throw new MemorySessionError("SESSION_INVALID", "session_id must be a non-empty string");
  }
}

function assertTurn(turn: SessionTurn, label: string): void {
  if (!turn.turn_id || typeof turn.turn_id !== "string") {
    throw new MemorySessionError("SESSION_INVALID", `${label}: invalid turn_id`);
  }
  if (typeof turn.at_ms !== "number" || !Number.isFinite(turn.at_ms)) {
    throw new MemorySessionError("SESSION_INVALID", `${label}: invalid at_ms`);
  }
  const roles = new Set(["user", "assistant", "system", "tool"]);
  if (!roles.has(turn.role)) {
    throw new MemorySessionError("SESSION_INVALID", `${label}: invalid role`);
  }
  if (typeof turn.text !== "string") {
    throw new MemorySessionError("SESSION_INVALID", `${label}: text must be string`);
  }
}

export function normalizeSessionPatch(patch: SessionPatch): SessionPatch {
  if (patch.recent_turns) {
    if (!Array.isArray(patch.recent_turns)) {
      throw new MemorySessionError("SESSION_INVALID", "recent_turns must be an array");
    }
    patch.recent_turns.forEach((t, i) => assertTurn(t, `recent_turns[${i}]`));
  }
  if (patch.tool_execution_summary !== undefined) {
    if (!Array.isArray(patch.tool_execution_summary)) {
      throw new MemorySessionError("SESSION_INVALID", "tool_execution_summary must be an array");
    }
    if (!patch.tool_execution_summary.every((x) => typeof x === "string")) {
      throw new MemorySessionError("SESSION_INVALID", "tool_execution_summary items must be strings");
    }
  }
  if (patch.runtime_summary !== undefined) {
    if (!Array.isArray(patch.runtime_summary)) {
      throw new MemorySessionError("SESSION_INVALID", "runtime_summary must be an array");
    }
    if (!patch.runtime_summary.every((x) => typeof x === "string")) {
      throw new MemorySessionError("SESSION_INVALID", "runtime_summary items must be strings");
    }
  }
  return patch;
}

export function createEmptySession(session_id: string, now_ms: number): SessionState {
  assertNonEmptySessionId(session_id);
  return {
    session_id,
    created_at_ms: now_ms,
    updated_at_ms: now_ms,
    recent_turns: [],
    tool_execution_summary: [],
    runtime_summary: [],
  };
}
