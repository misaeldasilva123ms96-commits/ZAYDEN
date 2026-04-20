# Forensic audit — Gemma GGUF model asset (`gemma-2-2b-it-f32.zip`)

**Traceability**

- Archive: `gemma-2-2b-it-f32.zip` (expected local path: repository root; not committed)
- Metadata: `research/source-models/manifests/gemma-2-2b-it-f32.manifest.json`

## Executive classification

- **Runnable status:** **Not runnable by this zip alone** — requires an external inference runtime (llama.cpp compatible server, Ollama, LM Studio, etc.).
- **Safe integration posture:** **Indirect only** via a **provider gateway adapter**; never as scattered hardcoded paths in ZAYDEN core.

## Inventory — entry points

- Zip contains a single entry: `gemma-2-2b-it-f32.gguf`

## Package manifests

- **None** (binary model weights)

## Dependency system

- **None** at the artifact level (runtime dependencies belong to the inference engine you choose)

## Language stacks

- **None** (binary)

## Build tools

- **None** (not source)

## Tests presence

- **None** in-archive; ZAYDEN should add **contract tests** around adapter configuration and failure paths in later phases.

## Documentation presence

- ZAYDEN manifest metadata only (this audit + JSON manifest)

## License / legal signals

- Model weights may be governed by **separate terms** from code in the repo. Treat redistribution/packaging as a **compliance task**.

## Missing critical files

- Optional: pinned `sha256_archive` for supply-chain hardening (intentionally omitted from fast gates due to archive size).

## Runtime assumptions

- Large disk footprint (~4.63GB zip in this workspace inventory)
- High RAM requirements likely for F32 inference depending on engine and quantization behavior

## Integration recommendation

- **Direct integration:** **No** (not in core)
- **Indirect integration:** **Yes** — provider adapter + observability fields (`provider_actual`, `runtime_mode`, fallback reasons) + explicit ops docs under `docs/providers/`
