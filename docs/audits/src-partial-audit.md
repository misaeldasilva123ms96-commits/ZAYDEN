# Forensic audit — partial TypeScript `src/` tree (`src.zip`)

**Traceability**

- Fingerprint: `docs/intake/artifact-hashes.json` → `src.zip`
- Unpacked canonical path: `research/source-src-partial/` (**flattened**: zip root is `src/`, files unpacked to the research folder root)

## Executive classification

- **Runnable status:** **Not runnable as a complete repository** — this artifact is a **partial source tree** missing the normal project root closure.
- **Safe integration posture:** **Not safe to integrate** until a dedicated completeness study proves build graph, licensing, and ownership boundaries.

## Inventory — entry points (observed inside partial tree)

| Kind | Path | Notes |
| --- | --- | --- |
| App entry | `main.tsx` | Imports indicate a Bun-heavy CLI/TUI application entry style |
| Other TS/TSX | many under subfolders | Large surface area (tools, assistant, ink, server, etc.) |

## Package manifests

- **No** `package.json` at the root of this artifact (expected, because only `src/` was archived).

## Dependency system

- **Unknown/incomplete from artifact alone** — imports reference modules that would normally be resolved by the missing repository root configuration.

## Language stacks

- **TypeScript / TSX** dominant
- Evidence of **Bun** APIs in entry (`bun:bundle` style imports observed in `main.tsx` during intake)

## Build tools

- **Not determinable** from partial tree alone (no root `package.json`, no `tsconfig.json` at partial root in this zip).

## Tests presence

- **Not assessed** as a complete runnable test suite from this artifact alone (partial tree).

## Documentation presence

- **None at partial root** (no README in the partial artifact root).

## License / legal signals

- **Unknown from artifact alone** — absence of root `LICENSE` in the partial archive is a **governance gap** for any direct reuse.

## Missing critical files (blocking “runnable product”)

- Repository root manifests (`package.json`, `LICENSE`, tooling configs) **not present** in the zip root
- Full dependency graph and build entrypoints **cannot** be reconstructed from this artifact alone without additional sources

## Runtime assumptions

- Cannot be stated safely beyond “likely expects Bun + Node ecosystem consistent with the missing root”.

## Integration recommendation

- **Direct integration:** **Not at all** (current evidence)
- **Architecture study:** **Yes** (read-only comparisons documented in ADRs/phase notes)
