# Testing — Intake gates (Phase 0/1)

## Purpose

These gates validate **reproducibility** and **governed layout**, not model inference quality.

## Commands

```bash
npm run intake:validate
npm test
npm run gate:intake
```

## Preconditions

- Vendor archives exist at repo root (see `README.md`)
- Unpacked trees exist under `research/*` (use `scripts/unpack-intake.ps1`, or `npm run intake:migrate` from legacy `sources/*`)

## Notes

- `gemma-2-2b-it-f32.zip` may be absent locally; the validator emits a **warning** but still passes if other gates succeed.
- When present, the validator checks **byte size** against `research/source-models/manifests/gemma-2-2b-it-f32.manifest.json`.
