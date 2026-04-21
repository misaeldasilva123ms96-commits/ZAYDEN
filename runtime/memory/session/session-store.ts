import type { SessionState } from "../base/session.types.js";

export interface SessionStore {
  get(session_id: string): SessionState | undefined;
  put(session_id: string, state: SessionState): void;
  delete(session_id: string): void;
}

/** Ephemeral, deterministic ordering for iteration (sorted by session_id). */
export class InMemorySessionStore implements SessionStore {
  private readonly data = new Map<string, SessionState>();

  get(session_id: string): SessionState | undefined {
    return this.data.get(session_id);
  }

  put(session_id: string, state: SessionState): void {
    this.data.set(session_id, state);
  }

  delete(session_id: string): void {
    this.data.delete(session_id);
  }

  listIds(): readonly string[] {
    return [...this.data.keys()].sort((a, b) => a.localeCompare(b));
  }
}
