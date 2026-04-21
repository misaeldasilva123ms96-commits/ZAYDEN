export const MEMORY_POLICY_CONTRACT_VERSION = "1.0.0" as const;

/** Declarative policy evaluated before any load/inject (Phase 8). */
export interface MemoryPolicy {
  contract_version: typeof MEMORY_POLICY_CONTRACT_VERSION;
  enable_session_state: boolean;
  enable_persistent_memory: boolean;
  max_recent_turns: number;
  max_memory_entries: number;
  max_context_tokens_estimate: number;
  include_tool_history: boolean;
  include_runtime_history: boolean;
  auto_persist: boolean;
  persistence_namespace: string | null;
}

export interface MemoryContextEntry {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  text: string;
}

export interface MemoryLoadObservation {
  readonly session_id: string;
  readonly session_found: boolean;
  readonly session_created: boolean;
  readonly recent_turn_count_used: number;
  readonly persistent_entries_used: number;
  readonly context_trimmed: boolean;
  readonly budget_estimate: number;
  readonly persistence_enabled: boolean;
  readonly warnings: readonly string[];
}

export const DEFAULT_MEMORY_POLICY: MemoryPolicy = {
  contract_version: MEMORY_POLICY_CONTRACT_VERSION,
  enable_session_state: true,
  enable_persistent_memory: false,
  max_recent_turns: 8,
  max_memory_entries: 16,
  max_context_tokens_estimate: 4_000,
  include_tool_history: true,
  include_runtime_history: true,
  auto_persist: false,
  persistence_namespace: null,
};
