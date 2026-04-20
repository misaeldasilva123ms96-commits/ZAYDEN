# ZAYDEN

ZAYDEN is a **governed, architecture-first** program for integrating a multi-provider, local-first AI runtime **without** building a fragile monolith.

This repository is intentionally staged behind **gates** (deterministic checks, documentation, provenance).

## Quickstart (Phase 0/1)

1. Place the vendor archives at the repository root (they are **not committed** to git; integrity is pinned in `docs/intake/artifact-hashes.json`):

- `openclaude-main.zip`
- `claw-code-main.zip`
- `src.zip`
- `system_prompts_leaks-main.zip`

Optional local model archive (also not committed):

- `gemma-2-2b-it-f32.zip`

2. Unpack governed trees into `research/`:

```powershell
.\scripts\unpack-intake.ps1
```

If you previously used the legacy `sources/*` layout locally:

```powershell
npm run intake:migrate
```

3. Validate intake + run tests:

```powershell
npm run gate:intake
```

## What lives where

- **ZAYDEN-owned scaffolding:** `apps/`, `runtime/`, `tests/`, `docs/`, `scripts/`, `package.json`
- **Forensic audits + classification matrix:** `docs/audits/*`
- **Upstream/reference material (unpacked, gitignored):** `research/source-*`
- **Model metadata (committed):** `research/source-models/manifests/`

## Documentation map

- **Architecture entrypoint:** `ARCHITECTURE.md`
- **Roadmap:** `ROADMAP.md`
- **Phases:** `docs/phases/`
- **Runbooks:** `docs/runbooks/`
- **Audits:** `docs/audits/`
- **ADRs:** `docs/decisions/`

## Provenance and safety posture

See `docs/PROVENANCE.md` and the Phase 0 forensic audits under `docs/audits/`.

## Status

Phase 0/1 establishes **forensic intake + foundation scaffolding + gates**. **This is not a claim of production readiness** for an end-to-end runtime.
