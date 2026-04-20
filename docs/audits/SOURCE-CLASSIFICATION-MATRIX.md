# Source classification matrix (Phase 0 gate)

This matrix is the **Phase 0 completion artifact**. No later phase should treat these classifications as implicit.

| Source asset | Unpacked path (canonical) | Runnable? | Integration safety | Direct integration | Notes |
| --- | --- | --- | --- | --- | --- |
| `openclaude-main.zip` | `research/source-openclaude/` | **Runnable** (with upstream build/runtime assumptions) | **Legal/compliance review required** (upstream `LICENSE` documents proprietary lineage) | **Not recommended** as copy-paste core; **indirect** via subprocess/adapter after policy review | Primary *operational reference* for ZAYDEN; treat as upstream product tree |
| `claw-code-main.zip` | `research/source-claw-code/` | **Partially runnable** (Python workspace + Rust workspace; multiple entrypoints) | **Medium** (engineering narrative + mixed stacks) | **Not recommended** as merged monolith; **indirect** for harness ideas/tests only | Python `src/main.py` exists; Rust workspace under `rust/` |
| `src.zip` | `research/source-src-partial/` | **Not runnable as a complete repo** (partial tree) | **High risk if integrated blindly** | **Not at all** (until completeness proven) | Missing repository root manifests; study-only |
| `system_prompts_leaks-main.zip` | `research/source-prompts-reference/` | **Reference-only** (not an executable system) | **High** if copied verbatim into product prompts | **Not at all** (product baseline) | Research patterns only; governed policy applies |
| `gemma-2-2b-it-f32.zip` | (archive local) + metadata in `research/source-models/manifests/` | **Runnable only with an external inference runtime** | **Medium** (weights licensing + ops) | **Not in core**; **indirect** via provider gateway | Never hardcode paths across the codebase |

## Gate statement

**Phase 0 gate:** **PASS** — matrix complete and linked to per-source forensic audits:

- `docs/audits/openclaude-audit.md`
- `docs/audits/claw-code-audit.md`
- `docs/audits/src-partial-audit.md`
- `docs/audits/system-prompts-research-audit.md`
- `docs/audits/gemma-model-audit.md`
