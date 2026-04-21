# F0-F10 baseline

## What F0-F10 achieved

- Governed repository foundation with source provenance/audits.
- Contract-first runtime core with deterministic validation boundaries.
- Provider gateway, routing, resilience, tooling, and memory/session layers.
- External HTTP API surface with normalized public request/response/error envelopes.
- Operational host boot layer with validated config, explicit dependency container, and graceful shutdown.

## What is stable

- Contract validation and schema posture in `runtime/contracts`.
- Runtime orchestration flow and boundaries across providers/tools/memory.
- API transport-thin pattern (`runtime/api`) with `RuntimeService` centralization.
- Host startup/shutdown process (`runtime/host`) and service entrypoint (`npm run serve`).
- Aggregate validation gate (`npm run gate:f0-f10`).

## Intentionally not implemented yet

- production auth enforcement
- streaming/WebSocket transport
- UI/frontend product surface
- Phase 11+ feature evolution

## How to run

```bash
npm run serve
```

Key env knobs:

- `HOST`, `PORT`, `NODE_ENV`, `LOG_LEVEL`
- `ENABLE_API`
- `LOCAL_PROVIDER_MODE`
- `ENABLE_PERSISTENT_MEMORY`, `MEMORY_FILE_PATH`

See `docs/runbooks/service-operations.md` for details.

## How to test

```bash
npm run typecheck
npm run test
npm run gate:f0-f10
```

Intake validation policy:

- `npm run intake:validate` runs repository baseline mode (`--mode=repo`) and does not require local forensic zip archives at repo root.
- `npm run intake:validate:forensic` is the strict local mode for archive presence/SHA checks and unpacked research trees.

## Known limitations

- no auth/rate-limiting guardrails at transport edge yet
- no streaming transport profile
- local provider runtime availability depends on environment setup

## Next recommended phase after release

**Phase 11: boundary hardening for deployment** (auth/rate-limit stubs, deployment profiles, and streaming ADR path) without violating transport/runtime separation.
