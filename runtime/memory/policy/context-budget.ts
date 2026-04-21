import type { MemoryContextEntry } from "../base/memory.types.js";

export function estimateEntryTokens(text: string): number {
  if (text.length === 0) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateEntriesTokens(entries: readonly MemoryContextEntry[]): number {
  return entries.reduce((s, e) => s + estimateEntryTokens(e.text), 0);
}

/**
 * When over budget: drop oldest entries first; if a single entry still exceeds the budget,
 * truncate its `text` deterministically (prefix) until it fits.
 */
export function enforceContextBudget(params: {
  entries: readonly MemoryContextEntry[];
  max_tokens: number;
}): {
  entries: MemoryContextEntry[];
  trimmed: boolean;
  budget_estimate: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  const queue = params.entries.map((e) => ({ ...e }));
  let trimmed = false;
  let budget = estimateEntriesTokens(queue);

  while (budget > params.max_tokens && queue.length > 0) {
    if (queue.length === 1) {
      const head = queue[0]!;
      const maxChars = Math.max(0, params.max_tokens * 4 - 4);
      const nextText = head.text.slice(0, maxChars);
      if (nextText === head.text) {
        queue.shift();
        trimmed = true;
        budget = estimateEntriesTokens(queue);
        continue;
      }
      queue[0] = { ...head, text: nextText };
      trimmed = true;
      budget = estimateEntriesTokens(queue);
      warnings.push("CONTEXT_BUDGET_EXCEEDED: truncated oversized entry text (prefix)");
      continue;
    }
    trimmed = true;
    queue.shift();
    budget = estimateEntriesTokens(queue);
  }

  if (trimmed && !warnings.length) {
    warnings.push("CONTEXT_BUDGET_EXCEEDED: deterministic trim (dropped oldest entries)");
  }

  return {
    entries: queue,
    trimmed,
    budget_estimate: estimateEntriesTokens(queue),
    warnings,
  };
}
