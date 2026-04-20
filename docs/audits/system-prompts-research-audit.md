# Forensic audit — system prompts reference corpus (`system_prompts_leaks-main.zip`)

**Traceability**

- Fingerprint: `docs/intake/artifact-hashes.json` → `system_prompts_leaks-main.zip`
- Unpacked canonical path: `research/source-prompts-reference/` (flattened from the GitHub archive top folder)

## Executive classification

- **Runnable status:** **Reference-only** — not an executable AI runtime; a curated collection of markdown/text material.
- **Safe integration posture:** **Not safe to treat as trusted product baseline**; **not safe** to copy proprietary/system prompt text verbatim into ZAYDEN product defaults.

## Inventory — “entry points”

There is **no program entrypoint**. Top-level folders include vendor buckets such as:

- `Anthropic/`, `OpenAI/`, `Google/`, `xAI/`, `Perplexity/`, `Misc/`

## Package manifests

- **None** (not a Node/Python/Rust product repo)

## Dependency system

- **None**

## Language stacks

- **Markdown/text** (documentation-like files)

## Build tools

- **None** (static corpus)

## Tests presence

- **None**

## Documentation presence

- `readme.md` (upstream), `CONTRIBUTING.md`, `.nojekyll` (suggests static site publishing upstream)

## License / legal signals

- Must be treated as **third-party collected material** with **uncertain redistribution rights** for downstream products.
- ZAYDEN policy: **research-only**; any future “lessons learned” must be captured as **ZAYDEN-owned** abstract guidance (no verbatim dumps in product logic).

## Missing critical files

- Not applicable — completeness is not defined as “runnable”.

## Runtime assumptions

- None (static files)

## Integration recommendation

- **Direct integration into runtime core:** **Not at all**
- **Indirect integration:** **Only** as research input behind explicit governance (human review + ADR + no verbatim copying policy)
