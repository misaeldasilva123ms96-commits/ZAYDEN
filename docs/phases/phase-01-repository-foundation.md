# Phase 1 — Foundation repository creation (complete)

## Objective

Create a clean, professional repository skeleton ready for controlled integration.

## What was created

- **Apps scaffold:** `apps/cli`, `apps/api`, `apps/ui`
- **Runtime scaffold:** `runtime/{core,contracts,providers,tools,memory,observability}`
- **Research isolation:** `research/README.md` + `research/source-models/manifests/`
- **Tests scaffold:** `tests/{unit,integration,contracts,regression,fixtures,mocks}`
- **Docs scaffold:** `docs/{phases,runbooks,providers}` plus existing architecture + audits
- **Automation scaffold:** `.github/workflows/ci.yml`
- **Root engineering files:** `ARCHITECTURE.md`, `ROADMAP.md`, `LICENSE`, `.editorconfig`, `.env.example`

## Gates

- **Intake validator:** `npm run intake:validate`
- **Unit tests (repo-owned):** `npm test`

## Notes on “cleanliness”

Unpacked upstream trees remain **gitignored** under `research/source-*` to keep review and diffs manageable. Reproducibility is enforced by pinned zip fingerprints (`docs/intake/artifact-hashes.json`) plus unpack/migrate scripts.

## Historical pointer

Earlier narrative intake notes were consolidated from `docs/intake/PHASE-01-SOURCE-INTAKE-REPORT.md` (now a short pointer file).
