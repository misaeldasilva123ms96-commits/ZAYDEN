# Runbook — intake (unpack, migrate, validate)

## Preconditions

Place vendor archives at the repository root (not committed):

- `openclaude-main.zip`
- `claw-code-main.zip`
- `src.zip`
- `system_prompts_leaks-main.zip`
- Optional: `gemma-2-2b-it-f32.zip`

## Unpack (canonical layout)

```powershell
.\scripts\unpack-intake.ps1
```

This writes to:

- `research/source-openclaude/`
- `research/source-claw-code/`
- `research/source-src-partial/` (flattened from `src/` inside the zip)
- `research/source-prompts-reference/`

## One-time migration (legacy `sources/` layout)

If you previously unpacked into `sources/intake`, `sources/study`, or `sources/reference`:

```powershell
npm run intake:migrate
```

## Validate gates

```powershell
npm run intake:validate
npm test
npm run gate:intake
```

## Failure triage

- **Missing unpacked paths:** rerun unpack script.
- **SHA256 mismatch:** your local zip differs from the pinned fingerprint in `docs/intake/artifact-hashes.json` — update intentionally via ADR + hash rotation.
- **Gemma warnings:** expected if `sha256_archive` is not pinned; size is the deterministic check when the zip exists.
