# Phase 5 — Deterministic provider routing and fallback orchestration

## Objective

Upgrade provider execution into policy-governed selection with explicit, observable fallback.

## Deliverables

- `runtime/providers/routing/routing-policy.ts`
- `runtime/providers/routing/routing-types.ts`
- `runtime/providers/routing/fallback-policy.ts`
- `runtime/providers/routing/provider-selection.ts`
- `runtime/core/runtime-orchestrator.ts`
- `tests/unit/routing-policy.test.ts`
- `tests/unit/fallback-policy.test.ts`
- `tests/integration/provider-routing.test.ts`
- `docs/architecture/provider-routing.md`
- `docs/decisions/ADR-0006-deterministic-provider-routing.md`

## Gate

PASS when all four modes are deterministic, fallback is explicit and observable, and tests cover mode semantics + fallback paths.
