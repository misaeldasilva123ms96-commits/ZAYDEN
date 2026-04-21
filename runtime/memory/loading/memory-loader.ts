import { MemorySessionError } from "../base/memory.errors.js";
import type { MemoryContextEntry } from "../base/memory.types.js";
import type { MemoryPolicy } from "../base/memory.types.js";
import type { PersistentMemoryStore } from "../persistence/memory-store.interface.js";

/**
 * Loads persistent entries only when policy + store permit (no session coupling here).
 */
export async function loadPersistentEntries(
  store: PersistentMemoryStore | undefined,
  policy: MemoryPolicy,
): Promise<MemoryContextEntry[]> {
  if (!policy.enable_persistent_memory) {
    return [];
  }
  if (!store) {
    throw new MemorySessionError(
      "MEMORY_STORE_UNAVAILABLE",
      "persistent memory enabled but no store configured",
    );
  }
  if (!policy.persistence_namespace || policy.persistence_namespace.trim().length === 0) {
    throw new MemorySessionError(
      "MEMORY_POLICY_VIOLATION",
      "persistence_namespace required when persistent memory is enabled",
    );
  }
  if (!(await store.isAvailable())) {
    throw new MemorySessionError("MEMORY_STORE_UNAVAILABLE", "persistent store is not available");
  }
  return [...(await store.listEntries(policy.persistence_namespace, policy.max_memory_entries))];
}
