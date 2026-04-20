# Provenance and licensing posture (ZAYDEN)

ZAYDEN tracks third-party material in **classified buckets** (see `docs/audits/SOURCE-CLASSIFICATION-MATRIX.md`).

## OpenClaude (`openclaude-main.zip`)

Unpacked to `research/source-openclaude/` after running `scripts/unpack-intake.ps1`.

Upstream `LICENSE` begins with a notice that the repository contains code derived from Anthropic’s Claude Code CLI and that the original proprietary work remains subject to Anthropic terms. ZAYDEN treats this tree as an **intake artifact** for study and future adapter work, not as a license-free “green field”.

**Traceability:** read the upstream `LICENSE` and `README.md` inside the research tree.

## claw-code (`claw-code-main.zip`)

Unpacked to `research/source-claw-code/`.

Upstream documentation describes the project’s intent and engineering history. ZAYDEN classifies this as **harness / runtime-quality inspiration**, isolated until a future phase defines explicit compatibility tests and adapter boundaries.

## Partial `src/` tree (`src.zip`)

Unpacked to `research/source-src-partial/` (flattened from the `src/` directory inside the zip).

This is explicitly **incomplete** (missing repository root manifests relative to a full upstream project). It is **architecture study material** until a dedicated validation phase proves buildability and ownership boundaries.

## Reference prompts (`system_prompts_leaks-main.zip`)

Unpacked to `research/source-prompts-reference/`.

ZAYDEN policy: **research/reference only**. Do not treat as trusted product baseline. Do not copy proprietary/system prompt text verbatim into runtime core logic.

## Gemma GGUF (`gemma-2-2b-it-f32.zip`)

Treated as a **local model asset**. Integration must go through a provider gateway adapter (see `research/source-models/manifests/gemma-2-2b-it-f32.manifest.json`).
