# Memory and session model (Phase 8)

## Session vs persistent memory

| Layer | Lifetime | Purpose |
| --- | --- | --- |
| **Session state** | Ephemeral (in-process store) | `session_id` continuity, recent turns, tool/runtime summaries for the active session. |
| **Persistent memory** | Optional pluggable store | Long-lived entries (`id`, `role`, `text`) retrieved only when policy enables persistence and a store is configured. |

Session data never auto-writes to persistence. Persistence happens only through `MemoryOrchestrator.persistEntry` (explicit API).

## Lifecycle (memory loading)

1. **Policy** — `resolveMemoryPolicy` merges defaults; both flags may disable the pipeline early.
2. **Session** — When `enable_session_state` is true, load or create (`ensure_session`) session via `SessionManager`.
3. **Persistent slice** — When `enable_persistent_memory` is true, `loadPersistentEntries` reads from the configured namespace (throws if store/namespace missing).
4. **Selection** — `selectMemoryCandidates` merges persistent entries, recent turns, and optional synthetic summaries.
5. **Budget** — `enforceContextBudget` trims deterministically (oldest entries first; single oversized entry is prefix-truncated).
6. **Injection** — `injectWithBudget` builds the `memory_context` envelope and `MemoryLoadObservation`.
7. **Validation** — `MemoryOrchestrator` validates the envelope with Ajv (`memory-context.schema.json`).

## Context budget

Token estimate is **heuristic only**: `ceil(text.length / 4)` per entry (no tokenizer). When the sum exceeds `max_context_tokens_estimate`, the controller trims until within budget and emits `CONTEXT_BUDGET_EXCEEDED` warnings.

## Persistence model

- **`InMemoryPersistentMemoryStore`** — deterministic ordering for tests.
- **`FilePersistentMemoryStore`** — writes under `baseDir/<namespace>/` using sanitized filenames; `saveEntry` writes a temp file then renames.

## Safety boundaries

- Memory **must not** self-inject: only `MemoryOrchestrator.buildMemoryContext` assembles `memory_context`.
- Routing/tool/provider policies are untouched by memory assembly.
- `auto_persist` defaults to **false**; `buildMemoryContext` never calls `saveEntry`.

## Limitations

- Token counts are estimates only; do not use for hard billing limits.
- File store does not implement locking across processes (single-writer assumption for Phase 8).
