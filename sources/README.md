# `sources/` — governed material boundaries

## `sources/intake/`

Unpacked **operational/harness** candidates:

- `openclaude-main/` from `openclaude-main.zip`
- `claw-code-main/` from `claw-code-main.zip`

These directories are **gitignored** when unpacked to keep the repository reviewable; reproducibility comes from pinned archive fingerprints in `docs/intake/artifact-hashes.json` plus `scripts/unpack-intake.ps1`.

## `sources/study/`

Unpacked **partial** `src/` tree for architecture study:

- `src/` from `src.zip`

## `sources/reference/`

Unpacked **reference-only** prompt collections:

- `system-prompts-leaks/` from `system_prompts_leaks-main.zip`

Governed by `docs/audits/REFERENCE-system-prompts-leaks.md`.

## `sources/models/manifests/`

Committed **metadata** for local model assets (not the weights themselves).
