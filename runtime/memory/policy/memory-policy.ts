import {
  DEFAULT_MEMORY_POLICY,
  MEMORY_POLICY_CONTRACT_VERSION,
  type MemoryPolicy,
} from "../base/memory.types.js";
import { MemorySessionError } from "../base/memory.errors.js";

export function resolveMemoryPolicy(partial?: Partial<MemoryPolicy>): MemoryPolicy {
  const merged: MemoryPolicy = {
    ...DEFAULT_MEMORY_POLICY,
    ...partial,
    contract_version: MEMORY_POLICY_CONTRACT_VERSION,
  };
  if (merged.max_recent_turns < 0 || merged.max_memory_entries < 0) {
    throw new MemorySessionError("MEMORY_POLICY_VIOLATION", "negative limits not allowed");
  }
  if (merged.max_context_tokens_estimate < 1) {
    throw new MemorySessionError("MEMORY_POLICY_VIOLATION", "max_context_tokens_estimate must be >= 1");
  }
  return merged;
}
