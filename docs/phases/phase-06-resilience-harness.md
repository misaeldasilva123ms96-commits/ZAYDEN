# Phase 6 — Resilience, chaos testing, and provider harness

## Goal

Upgrade ZAYDEN from a deterministic routing core to a **deterministic, stress-tested runtime** with explicit failure handling, bounded retries, timeouts, optional chaos simulation, and a provider compatibility harness — without moving routing decisions into adapters and without changing JSON Schemas.

## Deliverables

### Runtime

- `runtime/providers/resilience/*` — failure classification, retry policy, timeout wrapper.
- `runtime/providers/harness/*` — scenario catalog, chaos injector, provider harness.
- `runtime/core/resilience-controller.ts` — per-adapter timeout + retry loop (observable).
- `runtime/providers/routing/policy-profiles.ts` — `development` / `testing` / `production` policy patches.

### Tests

- `tests/resilience/*` — chaos + routing integration, timeout unit tests, retry policy unit tests.
- `tests/harness/provider-compatibility.test.ts` — contract-focused harness runs.

### Documentation

- `docs/architecture/resilience-model.md`
- `docs/runbooks/chaos-testing.md`
- `docs/runbooks/testing-strategy.md`
- `docs/decisions/ADR-0007-runtime-resilience-and-chaos-policy.md`

## Gate

Run `npm run gate:phase6`.
