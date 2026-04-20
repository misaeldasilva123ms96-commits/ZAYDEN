# ADR-0006 — Deterministic provider routing

- Status: Accepted
- Date: 2026-04-20

## Context

Phase 4 introduced bridge execution in adapters, but selection/fallback decisions needed a dedicated deterministic policy layer.

## Decision

1. Keep routing logic **outside adapters** in `runtime/core/runtime-orchestrator.ts` + `runtime/providers/routing/*`.
2. Keep routing policy **declarative** (`RoutingPolicy`) rather than hardcoded branches.
3. Enforce fallback as **explicit + observable** with:
   - ordered candidate chain
   - fallback flags/reasons
   - execution path and warnings in runtime inspection

## Why outside adapters

Adapters are execution bridges and must remain reusable and side-effect scoped. Embedding routing in adapters would duplicate policy and break determinism.

## Why declarative policy

Declarative config supports audits, tests, and future policy evolution (cost/latency/risk) without rewriting adapter code.

## Why explicit fallback

Silent fallback hides risk and complicates debugging. Explicit fallback improves reliability and post-mortem traceability.

## Consequences

- Runtime gets deterministic behavior across `LOCAL_ONLY`, `CLOUD_ONLY`, `HYBRID`, and `SAFE_FALLBACK`.
- Future phases can add richer routing signals while preserving contract and adapter boundaries.
