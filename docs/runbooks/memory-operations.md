# Memory operations runbook

## Configure session state

1. Construct `InMemorySessionStore` + `SessionManager`.
2. Pass the same `SessionManager` into `MemoryOrchestrator`.
3. Call `buildMemoryContext` with `policy.enable_session_state: true` and `ensure_session: true` on first contact for a `session_id`.
4. Use `SessionManager.appendTurn` / `updateSession` between turns to maintain continuity.

## Enable persistence

1. Choose a store (`InMemoryPersistentMemoryStore` for tests, `FilePersistentMemoryStore` for disk).
2. Pass it as the third constructor argument to `MemoryOrchestrator`.
3. Set `enable_persistent_memory: true` and a non-empty `persistence_namespace` in the memory policy.
4. Write entries explicitly via `MemoryOrchestrator.persistEntry({ policy, entry })`.

`buildMemoryContext` **never** writes to the persistent store.

## Reset / clear memory

- **Session only:** `SessionManager.clearSession(session_id)`.
- **In-memory persistence:** replace the store instance or track entry ids and overwrite via `saveEntry`.
- **File persistence:** delete the namespace directory under the configured `baseDir` (maintenance operation).

## Debug context trimming

Inspect `MemoryLoadObservation.warnings` for `CONTEXT_BUDGET_EXCEEDED` messages and compare `budget_estimate` vs `max_context_tokens_estimate`. Metadata on the envelope includes `memory_pipeline` diagnostics.

## Known limitations

- No cross-process file locking.
- Token budget is length-based heuristics only.
