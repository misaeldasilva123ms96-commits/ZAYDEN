# Source audit — partial `src/` tree (`src.zip`)

## Role in ZAYDEN

- **Architecture study only** until validated as buildable and complete enough to run

## Observed facts

- **Archive SHA-256:** `8CD0E0B61DDC5755E2120876ECE34F3B24613F1F5F0D97A659962A7282BC8921` (pinned in `docs/intake/artifact-hashes.json`)
- Unpacked layout root is `sources/study/src/` (no repository-level `package.json` in the zip root)

## Gap analysis (blocking “treat as runnable product”)

- Missing full project root (dependency closure unknown from this artifact alone)
- Build assumptions unknown until a dedicated phase inventories imports and tooling

## Allowed use (Phase 1)

- Read-only architectural comparisons (module boundaries, UI/tooling structure)
- Notes captured in phase reports and ADRs

## Forbidden shortcut

- Do not copy/paste large sections into ZAYDEN runtime core without an explicit compatibility study, license review, and tests.
