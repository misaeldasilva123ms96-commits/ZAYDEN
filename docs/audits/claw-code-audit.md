# Forensic audit — claw-code (`claw-code-main.zip`)

**Traceability**

- Fingerprint: `docs/intake/artifact-hashes.json` → `claw-code-main.zip`
- Unpacked canonical path: `research/source-claw-code/`

## Executive classification

- **Runnable status:** **Partially runnable** — multiple subsystems (Python workspace + Rust workspace + tests) with different entrypoints.
- **Safe integration posture:** **Indirect only** (patterns, parity ideas, optional local experiments), not as a fused dependency of ZAYDEN core.

## Inventory — entry points

| Kind | Path | Notes |
| --- | --- | --- |
| Python CLI module | `src/main.py` | Upstream documents `python3 -m src.main summary` style usage |
| Rust workspace | `rust/Cargo.toml` | Workspace members under `rust/crates/*` |
| Tests | `tests/*.py` | Python verification per upstream README |

## Package manifests

- **Rust:** `rust/Cargo.toml` workspace (multiple crates)
- **Python:** no `pyproject.toml` detected in this snapshot; Python layout is `src/` package modules

## Dependency system

- **Rust/cargo** workspace dependencies per-crate `Cargo.toml`
- **Python:** import-based dependencies (not centrally pinned in a manifest in this snapshot)

## Language stacks

- **Python** (`src/**/*.py`)
- **Rust** (`rust/crates/**`)

## Build tools (observed)

- **Cargo** (Rust edition 2021; workspace lints configured)
- **Python** invocation as module (`python3 -m src.main ...`)

## Tests presence

- `tests/` contains Python tests (example: `tests/test_porting_workspace.py` exists in tree)

## Documentation presence

- `README.md` (project narrative + layout + quickstart)
- `rust/README.md` (Rust subtree docs)

## License / legal signals

- Rust workspace metadata indicates `license = "MIT"` at workspace level in `rust/Cargo.toml`.
- README contains third-party narrative and links; treat communications/compliance separately from code license metadata.

## Missing critical files (for a single unified “one command build all”)

No single top-level manifest unifies Python + Rust + assets into one standard package manager (by design in this snapshot). That is a **integration complexity** signal for ZAYDEN.

## Runtime assumptions

- **Python 3** available for documented commands
- **Rust toolchain** required for Rust builds/tests
- Some modules may assume OS-specific behavior (not exhaustively audited here)

## Integration recommendation

- **Direct merge into ZAYDEN runtime core:** **No**
- **Selective reuse:** **Yes** as *inspiration* and *future parity fixtures*, captured via ZAYDEN-owned tests/docs/ADRs (not copy/paste imports)
