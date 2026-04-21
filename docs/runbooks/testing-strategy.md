# Testing strategy (ZAYDEN runtime)

ZAYDEN uses layered tests inspired by disciplined harness practice: deterministic fixtures, explicit policies, and minimal reliance on manual checks.

## Layers

| Layer | Command | Scope |
| --- | --- | --- |
| Unit | `npm run test:unit` | Pure policy/selection helpers, intake registry |
| Contracts | `npm run test:contracts` | Ajv validation against pinned JSON Schemas |
| Resilience | `npm run test:resilience` | Timeouts, retries, chaos routing, failure classification edges |
| Harness | `npm run test:harness` | Provider scenario matrix without network |
| Integration | `npm run test:integration` | Registry + gateway + orchestrator wiring |

## Determinism and flake control

- Prefer **zero** `retry_delay_ms` in CI-oriented policies (`environment_profile: "testing"` or explicit overrides).
- Chaos schedules are **data-driven maps** (`adapterId@attempt`) — no hidden global RNG.
- Timer-based tests use **small bounded delays** and generous outer budgets only when necessary.

## Gate

`npm run gate:phase6` runs typecheck, unit, resilience, harness, integration, contracts, and `intake:validate` for a merge-ready signal.

## Future parity-style tests

When external compatibility snapshots are pinned, add replayable fixtures under `tests/fixtures/` and extend the harness with scenario ids — keep network and secrets out of default CI.
