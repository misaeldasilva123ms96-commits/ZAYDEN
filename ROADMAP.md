# ZAYDEN roadmap

This roadmap is intentionally conservative: it describes **engineering phases**, not marketing promises.

## Completed

- **Phase 0 — Forensic intake:** per-source audits + classification matrix (`docs/audits/*`).
- **Phase 1 — Foundation repository:** governed folder structure + gates + baseline docs.
- **Phase 2 — Contract-first runtime:** JSON Schemas + Ajv validators + contract tests (`docs/architecture/runtime-contracts.md`).
- **Phase 3 — Provider gateway:** registry + validated gateway + mock + `gemma-local` compatibility adapter + orchestration skeleton.
- **Phase 4 — Local provider bridges:** HTTP/CLI bridge adapters with simulated degraded mode and integration tests.
- **Phase 5 — Routing policy:** deterministic adapter selection/fallback orchestration with observable provider chains.

## Next

- **Phase 6 — Compatibility harness:** optional automated smoke against pinned upstream snapshots (non-vendored core).
- **Phase 7 — Tooling policy:** tool registry, permissions, deterministic tool-call tests.
- **Phase 8 — Runtime API surface:** explicit service entrypoints for external clients.

## Explicit non-goals (near term)

- Blindly merging upstream repositories into one runnable monolith without ADRs and tests.
- Treating reference prompt corpora as production defaults.
