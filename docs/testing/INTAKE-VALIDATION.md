# Testing — Intake gates (Phase 1)

## Purpose

Phase 1 validates **reproducibility** and **governed layout**, not model inference quality.

## Commands

```bash
npm run intake:validate
npm test
npm run gate:intake
```

## Preconditions

- Vendor archives exist at repo root (`openclaude-main.zip`, `claw-code-main.zip`, `src.zip`, `system_prompts_leaks-main.zip`)
- Unpacked trees exist under `sources/*` (use `scripts/unpack-intake.ps1`)

## Notes

- `gemma-2-2b-it-f32.zip` may be absent locally; the validator emits a **warning** but still passes if other gates succeed.
- When present, the validator checks **byte size** against `sources/models/manifests/gemma-2-2b-it-f32.manifest.json`.
