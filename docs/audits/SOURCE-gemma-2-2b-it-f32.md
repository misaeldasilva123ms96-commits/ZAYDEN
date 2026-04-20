# Source audit — Gemma GGUF (`gemma-2-2b-it-f32.zip`)

## Role in ZAYDEN

- **Local model asset** for local-first experiments
- Must be integrated only through **provider gateway adapters** (see ADR-0001 rationale and manifest rules)

## Observed facts

- **Packaging:** single-entry zip containing `gemma-2-2b-it-f32.gguf`
- **Expected archive size:** `4629837305` bytes (pinned in `sources/models/manifests/gemma-2-2b-it-f32.manifest.json`)
- **SHA-256 pinning:** intentionally left `null` in Phase 1 manifest to avoid implying a full multi-GB hash was computed in-repo; record offline when available

## Operational risks

- **Disk and RAM pressure:** F32 GGUF is large; local inference requires compatible runtimes and hardware.
- **Distribution:** model weights may be subject to separate licensing terms from code; treat as a compliance item for any redistribution scenario.

## Gate policy

- Validator verifies size when the archive is present; warns when absent (common for developers who keep weights outside the repo).
