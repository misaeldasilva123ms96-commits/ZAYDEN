import type { MemoryContextEntry } from "../base/memory.types.js";

/**
 * Optional persistent knowledge layer. Implementations must never write outside their configured namespace.
 */
export interface PersistentMemoryStore {
  isAvailable(): Promise<boolean>;
  listEntries(namespace: string, limit: number): Promise<readonly MemoryContextEntry[]>;
  saveEntry(namespace: string, entry: MemoryContextEntry): Promise<void>;
}
