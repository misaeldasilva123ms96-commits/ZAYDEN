import type { ContractValidators } from "../contracts/validators.js";
import type { MemoryContextEntry } from "../memory/base/memory.types.js";
import type { MemoryLoadObservation } from "../memory/base/memory.types.js";
import type { MemoryPolicy } from "../memory/base/memory.types.js";
import { MemorySessionError } from "../memory/base/memory.errors.js";
import { injectWithBudget } from "../memory/loading/memory-injector.js";
import { loadPersistentEntries } from "../memory/loading/memory-loader.js";
import { selectMemoryCandidates } from "../memory/loading/memory-selector.js";
import { resolveMemoryPolicy } from "../memory/policy/memory-policy.js";
import type { PersistentMemoryStore } from "../memory/persistence/memory-store.interface.js";
import type { SessionManager } from "../memory/session/session-manager.js";

function emptyObservation(session_id: string): MemoryLoadObservation {
  return {
    session_id,
    session_found: false,
    session_created: false,
    recent_turn_count_used: 0,
    persistent_entries_used: 0,
    context_trimmed: false,
    budget_estimate: 0,
    persistence_enabled: false,
    warnings: [],
  };
}

/**
 * Builds contract-valid `memory_context` with bounded, policy-gated inputs.
 * Memory never self-injects: all loads flow through this orchestrator.
 */
export class MemoryOrchestrator {
  constructor(
    private readonly validators: ContractValidators,
    private readonly sessions: SessionManager,
    private readonly persistentStore?: PersistentMemoryStore,
  ) {}

  async buildMemoryContext(params: {
    session_id: string;
    policy?: Partial<MemoryPolicy>;
    ensure_session?: boolean;
  }): Promise<{ memory_context: unknown; observation: MemoryLoadObservation }> {
    const policy = resolveMemoryPolicy(params.policy);
    const session_id = params.session_id;
    const warnings: string[] = [];

    if (!policy.enable_session_state && !policy.enable_persistent_memory) {
      const obs = emptyObservation(session_id);
      const memory_context = {
        contract_version: "1.0.0" as const,
        metadata: {
          memory_disabled: true,
          pipeline: "zayden.memory@v1",
        },
      };
      this.assertMemoryContext(memory_context);
      return { memory_context, observation: { ...obs, warnings: [...obs.warnings, "memory: disabled by policy"] } };
    }

    let session = policy.enable_session_state ? this.sessions.getSession(session_id) : undefined;
    let session_created = false;
    if (policy.enable_session_state && !session) {
      if (params.ensure_session) {
        session = this.sessions.createSession(session_id);
        session_created = true;
      } else {
        throw new MemorySessionError("SESSION_NOT_FOUND", `session ${session_id} not found`);
      }
    }

    const persistent = await loadPersistentEntries(this.persistentStore, policy).catch((e) => {
      if (e instanceof MemorySessionError) throw e;
      throw new MemorySessionError("MEMORY_STORE_UNAVAILABLE", String(e));
    });

    const candidates = selectMemoryCandidates({
      policy,
      session: session ?? null,
      persistent,
    });

    const recent_used = session
      ? Math.min(session.recent_turns.length, policy.max_recent_turns)
      : 0;
    const persistent_used = Math.min(persistent.length, policy.max_memory_entries);

    const { record, observation } = injectWithBudget({
      candidates,
      max_context_tokens_estimate: policy.max_context_tokens_estimate,
      base: {
        session_id,
        session_found: Boolean(session),
        session_created,
        recent_turn_count_used: recent_used,
        persistent_entries_used: persistent_used,
        persistence_enabled: policy.enable_persistent_memory,
      },
      initialWarnings: warnings,
    });

    this.assertMemoryContext(record);
    return { memory_context: record, observation };
  }

  /**
   * Explicit persistence API — never called implicitly by `buildMemoryContext`.
   */
  async persistEntry(params: {
    policy: MemoryPolicy;
    entry: MemoryContextEntry;
  }): Promise<void> {
    this.assertValidMemoryEntry(params.entry);
    const policy = resolveMemoryPolicy(params.policy);
    if (!policy.enable_persistent_memory) {
      throw new MemorySessionError(
        "MEMORY_POLICY_VIOLATION",
        "cannot persist when persistent memory is disabled",
      );
    }
    if (!this.persistentStore) {
      throw new MemorySessionError("MEMORY_STORE_UNAVAILABLE", "no persistent store configured");
    }
    if (!policy.persistence_namespace || policy.persistence_namespace.trim().length === 0) {
      throw new MemorySessionError("MEMORY_POLICY_VIOLATION", "persistence_namespace required");
    }
    if (!(await this.persistentStore.isAvailable())) {
      throw new MemorySessionError("MEMORY_STORE_UNAVAILABLE", "store not available");
    }
    await this.persistentStore.saveEntry(policy.persistence_namespace, params.entry);
  }

  private assertMemoryContext(data: unknown): void {
    const v = this.validators.validateMemoryContext;
    if (!v(data)) {
      const msg = JSON.stringify(v.errors);
      throw new MemorySessionError("MEMORY_ENTRY_INVALID", `memory_context invalid: ${msg}`);
    }
  }

  private assertValidMemoryEntry(entry: MemoryContextEntry): void {
    if (!entry.id || typeof entry.id !== "string" || entry.id.trim().length === 0) {
      throw new MemorySessionError("MEMORY_ENTRY_INVALID", "memory entry id invalid");
    }
    const roles = new Set(["system", "user", "assistant", "tool"]);
    if (!roles.has(entry.role)) {
      throw new MemorySessionError("MEMORY_ENTRY_INVALID", "memory entry role invalid");
    }
    if (typeof entry.text !== "string") {
      throw new MemorySessionError("MEMORY_ENTRY_INVALID", "memory entry text invalid");
    }
  }
}
