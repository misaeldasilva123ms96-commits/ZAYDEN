import type { MemoryContextEntry } from "../base/memory.types.js";
import type { MemoryLoadObservation } from "../base/memory.types.js";
import { enforceContextBudget } from "../policy/context-budget.js";

export function buildMemoryContextRecord(params: {
  entries: readonly MemoryContextEntry[];
  metadata: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    contract_version: "1.0.0",
    entries: [...params.entries],
    metadata: { ...params.metadata },
  };
}

export function injectWithBudget(params: {
  candidates: readonly MemoryContextEntry[];
  max_context_tokens_estimate: number;
  base: Pick<
    MemoryLoadObservation,
    | "session_id"
    | "session_found"
    | "session_created"
    | "recent_turn_count_used"
    | "persistent_entries_used"
    | "persistence_enabled"
  >;
  initialWarnings?: readonly string[];
}): { record: Record<string, unknown>; observation: MemoryLoadObservation } {
  const budgeted = enforceContextBudget({
    entries: params.candidates,
    max_tokens: params.max_context_tokens_estimate,
  });
  const record = buildMemoryContextRecord({
    entries: budgeted.entries,
    metadata: {
      memory_pipeline: { ...params.base },
      context_trimmed: budgeted.trimmed,
      budget_estimate: budgeted.budget_estimate,
    },
  });
  const observation: MemoryLoadObservation = {
    ...params.base,
    context_trimmed: budgeted.trimmed,
    budget_estimate: budgeted.budget_estimate,
    warnings: [...(params.initialWarnings ?? []), ...budgeted.warnings],
  };
  return { record, observation };
}
