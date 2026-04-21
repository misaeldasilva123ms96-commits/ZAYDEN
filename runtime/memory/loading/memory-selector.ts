import type { MemoryPolicy } from "../base/memory.types.js";
import type { MemoryContextEntry } from "../base/memory.types.js";
import type { SessionTurn, SessionState } from "../base/session.types.js";

function turnToEntry(turn: SessionTurn): MemoryContextEntry {
  return {
    id: `session:${turn.turn_id}`,
    role: turn.role,
    text: turn.text,
  };
}

/**
 * Builds ordered candidate entries from session + persistent slices (pre-budget).
 * Order: persistent (already sorted by id), chronological session turns, synthetic summaries.
 */
export function selectMemoryCandidates(params: {
  policy: MemoryPolicy;
  session: SessionState | null;
  persistent: readonly MemoryContextEntry[];
}): MemoryContextEntry[] {
  const { policy, session, persistent } = params;
  const out: MemoryContextEntry[] = [];

  if (policy.enable_persistent_memory) {
    out.push(...persistent.slice(0, policy.max_memory_entries));
  }

  if (policy.enable_session_state && session) {
    const turns = session.recent_turns;
    const slice = turns.slice(Math.max(0, turns.length - policy.max_recent_turns));
    for (const t of slice) {
      out.push(turnToEntry(t));
    }
    if (policy.include_tool_history) {
      session.tool_execution_summary.forEach((line, i) => {
        out.push({
          id: `tool-summary:${session.session_id}:${i}`,
          role: "tool",
          text: line,
        });
      });
    }
    if (policy.include_runtime_history) {
      session.runtime_summary.forEach((line, i) => {
        out.push({
          id: `runtime-summary:${session.session_id}:${i}`,
          role: "system",
          text: line,
        });
      });
    }
  }

  return out;
}
