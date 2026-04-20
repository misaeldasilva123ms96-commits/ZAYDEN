# ZAYDEN

ZAYDEN is a **governed, architecture-first** program for integrating a multi-provider, local-first AI runtime **without** building a fragile monolith.

This repository is intentionally staged behind **gates** (deterministic checks, documentation, provenance). Phase 1 establishes **Source Intake** only.

## Quickstart (Phase 1)

1. Place the vendor archives at the repository root (they are **not committed** to git; integrity is pinned in `docs/intake/artifact-hashes.json`):

- `openclaude-main.zip`
- `claw-code-main.zip`
- `src.zip`
- `system_prompts_leaks-main.zip`

Optional local model archive (also not committed):

- `gemma-2-2b-it-f32.zip`

See `docs/intake/PHASE-01-SOURCE-INTAKE-REPORT.md` for classification and gate semantics.

2. Unpack governed trees:

```powershell
.\scripts\unpack-intake.ps1
```

3. Validate intake + run tests:

```powershell
npm run gate:intake
```

## What lives where

- **ZAYDEN-owned scaffolding:** `docs/`, `runtime/` (stubs), `scripts/`, `test/`, `package.json`
- **Upstream intake (unpacked, gitignored):** `sources/intake/`, `sources/study/`, `sources/reference/`
- **Model metadata (committed):** `sources/models/manifests/`
- **Large model archive (local-only by default):** `gemma-2-2b-it-f32.zip` (gitignored)

## Documentation map

- Architecture: `docs/architecture/`
- Phase reports: `docs/intake/`
- Source audits: `docs/audits/`
- ADRs: `docs/decisions/`
- Testing notes: `docs/testing/`

## Provenance and safety posture

OpenClaude upstream carries explicit proprietary provenance notices. Reference prompt material is isolated and **must not** be copied verbatim into product logic. See `docs/PROVENANCE.md` and `docs/audits/REFERENCE-system-prompts-leaks.md`.

## Status

Phase 1 completes Source Intake scaffolding and validation. **This is not a claim of production readiness** for an end-to-end runtime.
