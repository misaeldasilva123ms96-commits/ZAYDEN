# Phase 7 — Tooling policy and execution boundary

## Goal

Introduce a **first-class, explicit tool layer**: registry, permission policy, invocation validation, deterministic execution with timeouts, normalized results/errors, and observability — without coupling tools to providers or altering JSON Schemas.

## Deliverables

### Runtime (`runtime/tools/`)

- `base/` — `ToolDefinition`, types, typed errors.
- `registry/tool-registry.ts` — registration catalog.
- `policy/` — chat policy resolution, permission resolver, invocation validator (Ajv + optional per-tool JSON Schema).
- `execution/` — `ToolExecutor` (timeout boundary), `tool-result-normalizer`.
- `builtins/` — `echo`, `clock`, `fail`, plus `register-builtins.ts`.

### Core

- `runtime/core/tool-orchestrator.ts` — single supported execution entrypoint.

### Tests

- `tests/tools/*` — registry, policy, execution, error normalization.
- `tests/integration/tool-orchestrator.test.ts` — end-to-end wiring.

### Documentation

- `docs/architecture/tooling-model.md`
- `docs/runbooks/tool-execution.md`
- `docs/decisions/ADR-0008-tool-execution-boundary.md`

## Gate

Run `npm run gate:phase7`.
