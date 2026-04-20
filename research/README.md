# `research/` — isolated upstream and reference material

This directory holds **unpacked third-party artifacts** used for study, parity, and operational reference.

## Canonical layout

- `source-openclaude/` — OpenClaude upstream tree
- `source-claw-code/` — claw-code upstream tree
- `source-src-partial/` — partial `src/` tree (non-complete repo)
- `source-prompts-reference/` — reference-only prompt corpus (non-trusted baseline)
- `source-models/manifests/` — machine-readable manifests for local model assets

## Reproducibility

Unpack is deterministic via `scripts/unpack-intake.ps1`. Fingerprints for vendor zips are pinned in `docs/intake/artifact-hashes.json`.

## Git policy

Unpacked trees are **gitignored** to keep review load manageable; do not commit them unless an explicit ADR changes that policy.
