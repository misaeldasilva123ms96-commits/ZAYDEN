# Phase 10 — Service host entrypoint

**Status:** complete  
**Objective:** make ZAYDEN operationally bootable as a service process without violating runtime/API boundaries.

## Delivered artifacts

- `runtime/host/config/*` for typed env validation + normalization
- `runtime/host/bootstrap/*` for explicit dependency wiring, startup, and graceful shutdown
- `runtime/host/entrypoints/serve.ts` as run-ready process entrypoint
- Host tests: `tests/host/*`
- Host integration: `tests/integration/service-host.test.ts`
- Docs:
  - `docs/architecture/host-runtime-model.md`
  - `docs/runbooks/service-operations.md`
  - `docs/decisions/ADR-0011-service-host-boundary.md`

## Gate checklist

- [x] Host layer handles config + startup + wiring + shutdown only.
- [x] Runtime logic remains in orchestrators and `RuntimeService`.
- [x] `RuntimeService` stays the only request entrypoint from transport.
- [x] Config is validated with explicit typed errors.
- [x] Dependency container is explicit and testable.
- [x] Graceful shutdown supports SIGINT/SIGTERM and repeated-signal safety.
- [x] Host boot path is covered by tests and integration.

## Notes

- Host supports local provider mode selection without coupling runtime to a single provider implementation.
- Readiness strictness is host-configurable input for future policy controls while readiness semantics remain runtime-owned.
