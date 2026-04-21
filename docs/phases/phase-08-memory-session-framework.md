# Phase 8 — Session framework and controlled memory

## Goal

Add explicit **session continuity** and an **optional persistent memory layer** with policy gating, bounded context injection, deterministic trimming, normalized errors, and observability — without changing core JSON contracts or crossing provider/tool boundaries.

## Deliverables

### Runtime (`runtime/memory/`)

- Types + errors (`base/`)
- Session store/manager/normalizer (`session/`)
- Persistence adapters (`persistence/`)
- Loader/selector/injector (`loading/`)
- Policy + context budget (`policy/`)
- `runtime/core/memory-orchestrator.ts`

### Tests

- `tests/memory/*`
- `tests/integration/memory-orchestrator.test.ts`

### Documentation

- `docs/architecture/memory-model.md`
- `docs/runbooks/memory-operations.md`
- `docs/decisions/ADR-0009-memory-session-boundaries.md`

## Gate

Run `npm run gate:phase8`.
