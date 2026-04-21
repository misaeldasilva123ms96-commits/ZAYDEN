# ZAYDEN roadmap

This roadmap is intentionally conservative: it describes **engineering phases**, not marketing promises.

## Completed

- **Phase 0 — Forensic intake:** per-source audits + classification matrix (`docs/audits/*`).
- **Phase 1 — Foundation repository:** governed folder structure + gates + baseline docs.
- **Phase 2 — Contract-first runtime:** JSON Schemas + Ajv validators + contract tests (`docs/architecture/runtime-contracts.md`).
- **Phase 3 — Provider gateway:** registry + validated gateway + mock + `gemma-local` compatibility adapter + orchestration skeleton.
- **Phase 4 — Local provider bridges:** HTTP/CLI bridge adapters with simulated degraded mode and integration tests.
- **Phase 5 — Routing policy:** deterministic adapter selection/fallback orchestration with observable provider chains.
- **Phase 6 — Resilience + harness:** failure classification, bounded retries/timeouts, deterministic chaos, provider scenario harness, environment policy profiles (`docs/phases/phase-06-resilience-harness.md`).
- **Phase 7 — Tooling policy:** tool registry, permission model, invocation validation, timeout-wrapped executor, normalized errors, observability (`docs/phases/phase-07-tooling-policy.md`).
- **Phase 8 — Session + memory:** ephemeral session store/manager, optional persistence adapters, bounded memory assembly via `MemoryOrchestrator` (`docs/phases/phase-08-memory-session-framework.md`).
- **Phase 9 — Runtime API surface:** thin HTTP boundary, public schemas, `RuntimeService` entrypoint, health/readiness, normalized errors (`docs/phases/phase-09-runtime-api-surface.md`).

## Next

- **Phase 10 — TBD:** extend external operability (host binary, auth boundary, or streaming profile) behind new ADRs without relaxing transport/runtime separation.

## Explicit non-goals (near term)

- Blindly merging upstream repositories into one runnable monolith without ADRs and tests.
- Treating reference prompt corpora as production defaults.
