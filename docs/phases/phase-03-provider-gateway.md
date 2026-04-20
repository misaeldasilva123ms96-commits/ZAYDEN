# Phase 3 — Provider gateway + OpenClaude adaptation framing

## Objectives

1. Implement a **provider gateway** that enforces Phase 2 contracts at ingress/egress.
2. Document how **OpenClaude** will inform future work **without** invasive code transplant.

## Deliverables (code)

- `runtime/providers/base/*` — interface + errors + type aliases
- `runtime/providers/registry/provider-registry.ts` — `ProviderRegistry` + `ProviderGateway`
- `runtime/providers/adapters/mock/mock.adapter.ts` — deterministic tests
- `runtime/providers/adapters/local/gemma-local.adapter.ts` + `gemma-local.health.ts` — env-gated stub (no inference)
- `runtime/core/orchestrator-skeleton.ts` — composition seed
- `tests/integration/provider-gateway.test.ts`

## Deliverables (documentation)

- `docs/architecture/openclaude-adaptation-plan.md`

## Gate

- **PASS** if `npm run typecheck` and provider integration tests pass.
- **OpenClaude rule:** no imports from `research/source-openclaude` in gateway/core layers in this phase.
