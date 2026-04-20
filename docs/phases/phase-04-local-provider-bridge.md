# Phase 4 — Local model provider bridge integration

## Objective

Upgrade local provider execution from stub behavior to isolated bridge execution without changing contracts or gateway structure.

## Deliverables

- HTTP bridge adapter: `runtime/providers/adapters/local/gemma-http.adapter.ts`
- CLI bridge adapter: `runtime/providers/adapters/local/gemma-cli.adapter.ts`
- Shared I/O helpers: `runtime/providers/adapters/shared/http-client.ts`, `runtime/providers/adapters/shared/process-runner.ts`
- Improved health checks: `runtime/providers/adapters/local/gemma-local.health.ts`
- Integration tests: `tests/integration/provider-bridge.test.ts`
- Provider docs: `docs/providers/bridge-local-runtime.md`, `docs/providers/local-gemma.md`

## Gate

PASS when:

- contracts unchanged
- gateway unchanged in structure
- adapter failures are normalized (`ProviderExecutionError` envelope)
- integration tests pass (`npm run test:integration`)
