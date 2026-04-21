export type SessionRole = "user" | "assistant" | "system" | "tool";

export interface SessionTurn {
  readonly turn_id: string;
  readonly at_ms: number;
  readonly role: SessionRole;
  readonly text: string;
}

export interface SessionState {
  readonly session_id: string;
  readonly created_at_ms: number;
  updated_at_ms: number;
  recent_turns: SessionTurn[];
  tool_execution_summary: string[];
  runtime_summary: string[];
}

/** Allowed mutation surface for `updateSession`. */
export interface SessionPatch {
  recent_turns?: SessionTurn[];
  tool_execution_summary?: string[];
  runtime_summary?: string[];
}
