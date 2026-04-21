import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { MemorySessionError } from "../base/memory.errors.js";
import type { MemoryContextEntry } from "../base/memory.types.js";
import type { PersistentMemoryStore } from "./memory-store.interface.js";

function sanitizeSegment(s: string): string {
  return s.replace(/[^\w\-]+/g, "_").replace(/^_|_$/g, "") || "default";
}

function assertValidEntry(entry: MemoryContextEntry): void {
  if (!entry.id || typeof entry.id !== "string") {
    throw new MemorySessionError("MEMORY_ENTRY_INVALID", "entry.id required");
  }
  const roles = new Set(["system", "user", "assistant", "tool"]);
  if (!roles.has(entry.role)) {
    throw new MemorySessionError("MEMORY_ENTRY_INVALID", "entry.role invalid");
  }
  if (typeof entry.text !== "string") {
    throw new MemorySessionError("MEMORY_ENTRY_INVALID", "entry.text must be string");
  }
}

/**
 * File-backed persistence under `baseDir/<namespace>/`. Writes are confined to that subtree.
 */
export class FilePersistentMemoryStore implements PersistentMemoryStore {
  constructor(private readonly baseDir: string) {}

  private nsDir(namespace: string): string {
    return join(this.baseDir, sanitizeSegment(namespace));
  }

  private entryPath(namespace: string, entryId: string): string {
    return join(this.nsDir(namespace), `${sanitizeSegment(entryId)}.json`);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await mkdir(this.baseDir, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  async listEntries(namespace: string, limit: number): Promise<readonly MemoryContextEntry[]> {
    const dir = this.nsDir(namespace);
    await mkdir(dir, { recursive: true });
    const names = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort((a, b) => a.localeCompare(b));
    const out: MemoryContextEntry[] = [];
    for (const n of names) {
      if (out.length >= limit) break;
      const raw = await readFile(join(dir, n), "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") continue;
      const e = parsed as MemoryContextEntry;
      try {
        assertValidEntry(e);
        out.push(e);
      } catch {
        throw new MemorySessionError("MEMORY_ENTRY_INVALID", `invalid persisted file ${n}`);
      }
    }
    return out;
  }

  async saveEntry(namespace: string, entry: MemoryContextEntry): Promise<void> {
    assertValidEntry(entry);
    const dir = this.nsDir(namespace);
    await mkdir(dir, { recursive: true });
    const target = this.entryPath(namespace, entry.id);
    const tmp = `${target}.tmp`;
    const body = JSON.stringify(entry);
    await writeFile(tmp, body, "utf8");
    await rename(tmp, target);
  }
}
