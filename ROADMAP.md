# ZAYDEN roadmap

This roadmap is intentionally conservative: it describes **engineering phases**, not marketing promises.

## Completed

- **Phase 0 — Forensic intake:** per-source audits + classification matrix (`docs/audits/*`).
- **Phase 1 — Foundation repository:** governed folder structure + gates + baseline docs.
- **Phase 2 — Contract-first runtime:** JSON Schemas + Ajv validators + contract tests (`docs/architecture/runtime-contracts.md`).

## Next

- **Phase 3 — Provider gateway (implementation):** adapters that map external SDKs into `provider-request` / `provider-response` without leaking vendor types into core.
- **Phase 3 — Compatibility harness:** optional automated smoke against pinned upstream snapshots (non-vendored core).
- **Phase 4 — Tooling policy:** tool registry, permissions, deterministic tool-call tests.

## Explicit non-goals (near term)

- Blindly merging upstream repositories into one runnable monolith without ADRs and tests.
- Treating reference prompt corpora as production defaults.
