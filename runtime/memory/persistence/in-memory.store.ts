import type { MemoryContextEntry } from "../base/memory.types.js";
import type { PersistentMemoryStore } from "./memory-store.interface.js";

/** Deterministic in-process persistence for tests and local tooling. */
export class InMemoryPersistentMemoryStore implements PersistentMemoryStore {
  private readonly byNamespace = new Map<string, MemoryContextEntry[]>();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async listEntries(namespace: string, limit: number): Promise<readonly MemoryContextEntry[]> {
    const all = [...(this.byNamespace.get(namespace) ?? [])].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    return all.slice(0, Math.max(0, limit));
  }

  async saveEntry(namespace: string, entry: MemoryContextEntry): Promise<void> {
    const cur = [...(this.byNamespace.get(namespace) ?? [])];
    const idx = cur.findIndex((e) => e.id === entry.id);
    if (idx >= 0) cur[idx] = entry;
    else cur.push(entry);
    cur.sort((a, b) => a.id.localeCompare(b.id));
    this.byNamespace.set(namespace, cur);
  }
}
