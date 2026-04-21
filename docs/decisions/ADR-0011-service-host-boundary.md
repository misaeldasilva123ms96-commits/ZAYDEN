# ADR-0011 — Service host boundary

## Status

Accepted — Phase 10

## Context

Phase 9 introduced an external HTTP API but lacked an explicit operational boot layer for real service process startup/shutdown. Boot concerns were at risk of being mixed into transport or runtime code.

## Decision

1. **Separate host/bootstrap from runtime logic**  
   Create `runtime/host/*` for config loading, dependency wiring, server startup, and process signal handling only.

2. **Require normalized, validated config**  
   Environment variables are mapped into a typed `HostConfig` with explicit error codes (`CONFIG_INVALID`, `CONFIG_MISSING`, `CONFIG_CONFLICT`). No silent fallback for malformed values.

3. **Keep dependency wiring explicit and replaceable**  
   `createDependencyContainer(config)` composes registries, orchestrators, `RuntimeService`, and API server without hidden singletons.

4. **Keep host layer thin**  
   Host code must not own routing/provider/tool/memory business rules. It invokes existing modules and leaves request execution to `RuntimeService` via transport.

## Consequences

### Positive

- Service startup is testable and deterministic.
- Operational concerns (boot/shutdown) are easy to reason about.
- Runtime and API boundaries remain preserved.

### Negative

- More composition code and tests to maintain.
- Additional config surface requires documentation discipline.

## Alternatives considered

- **Bootstrap directly in API transport module** — rejected (boundary leakage).
- **Global singleton container** — rejected (harder tests, hidden mutable state).

## References

- `runtime/host/bootstrap/dependency-container.ts`
- `runtime/host/bootstrap/runtime-bootstrap.ts`
- `runtime/host/bootstrap/graceful-shutdown.ts`
- `docs/architecture/host-runtime-model.md`
