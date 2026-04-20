# Phase 01 — Source Intake (Report)

## What was done

- Initialized a **ZAYDEN repository layout** aligned to the target 8-layer architecture (scaffold + documentation + gates), without merging unrelated codebases into a single runtime implementation.
- Added **governed intake mechanics**:
  - `scripts/unpack-intake.ps1` reproduces unpack paths deterministically.
  - `scripts/validate-source-intake.mjs` enforces presence of unpacked trees and verifies pinned SHA-256 for small archives.
  - `docs/intake/artifact-hashes.json` records pinned fingerprints for reproducibility.
- Added **model manifest** metadata without committing multi-gigabyte weights: `sources/models/manifests/gemma-2-2b-it-f32.manifest.json`.
- Added **audit trail** documents under `docs/audits/` plus provenance summary `docs/PROVENANCE.md`.
- Recorded architectural boundary decision in `docs/decisions/ADR-0001-repository-layout-and-source-isolation.md`.
- Added **ZAYDEN-owned contract stubs** under `runtime/core/contracts.mjs` and an observability schema stub `runtime/observability/event-schema.json`.
- Added **tests** under `test/` and a combined gate command in `package.json`.

## Why it was done

The program charter requires **classification, isolation, validation, and traceability** before deeper integration. Phase 1 establishes a senior-reviewable baseline: what exists, where it lives, how it is reproduced, and what is explicitly forbidden (reference prompt copying, treating partial `src/` as runnable).

## Files created

- `.gitignore`
- `package.json`
- `README.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `docs/architecture/OVERVIEW.md`
- `docs/architecture/LAYER-MODEL.md`
- `docs/intake/PHASE-01-SOURCE-INTAKE-REPORT.md` (this file)
- `docs/intake/artifact-hashes.json`
- `docs/decisions/ADR-0001-repository-layout-and-source-isolation.md`
- `docs/PROVENANCE.md`
- `docs/testing/INTAKE-VALIDATION.md`
- `docs/audits/*` (per-source audits + reference policy)
- `scripts/unpack-intake.ps1`
- `scripts/validate-source-intake.mjs`
- `sources/README.md`
- `sources/models/manifests/gemma-2-2b-it-f32.manifest.json`
- `runtime/core/contracts.mjs`
- `runtime/core/README.md`
- `runtime/provider-gateway/README.md`
- `runtime/tooling/README.md`
- `runtime/memory/README.md`
- `runtime/observability/event-schema.json`
- `runtime/observability/README.md`
- `test/intake-registry.test.mjs`

## Files modified

- `.gitignore` (vendor zips are intentionally excluded from version control; only fingerprints are pinned)

## Architectural impact

- Establishes **hard isolation boundaries** for third-party trees (gitignored unpack targets) while keeping **ZAYDEN-owned** engineering artifacts reviewable in git.
- Establishes a **deterministic intake gate** as the first “quality bar” before any runtime/provider work.

## Risks discovered

- **OpenClaude provenance complexity:** upstream `LICENSE` indicates proprietary lineage; downstream use requires legal clarity for your intended deployment model.
- **Partial `src.zip` completeness risk:** cannot be treated as a buildable product root without further inventory.
- **Reference corpus risk:** must not become implicit “defaults” for prompts in shipped logic.
- **Gemma hashing cost:** SHA-256 for multi-GB archives is intentionally not part of the default fast gate; size is pinned and hash can be recorded offline.

## Validation executed

- `npm run intake:validate`
- `npm test`
- `npm run gate:intake`

## Remaining gaps (explicit)

- No ZAYDEN-owned provider implementations yet (only gateway scaffold README).
- No end-to-end inference loop wired to Gemma yet (by design).
- No CI workflow committed yet (optional next step: GitHub Actions running `npm test` only, plus cached unpack for integration).

## Next recommended step

- **Phase 2 proposal:** define the provider gateway interface in ZAYDEN-owned code (`runtime/provider-gateway/`) as stable contracts + mocks, then add an adapter that can target **one** supported local runtime without modifying OpenClaude internals first (wrapper/boundary-first).

## Gate status

**PASS** — if and only if the validation commands succeed on the machine reporting this phase.
