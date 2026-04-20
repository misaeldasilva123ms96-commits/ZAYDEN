# Forensic audit — OpenClaude (`openclaude-main.zip`)

**Traceability**

- Fingerprint: `docs/intake/artifact-hashes.json` → `openclaude-main.zip`
- Unpacked canonical path: `research/source-openclaude/`

## Executive classification

- **Runnable status:** **Runnable** as an upstream Node/TypeScript CLI product *given* its documented build toolchain (not validated as part of ZAYDEN CI yet).
- **Safe integration posture:** **Indirect only** until legal/compliance review of upstream licensing notices; avoid “silent vendoring” inside ZAYDEN-owned modules.

## Inventory — entry points

| Kind | Path | Notes |
| --- | --- | --- |
| Published CLI bin | `bin/openclaude` | Delegates to packaged `dist/cli.mjs` in releases |
| Dev entry | `package.json` → `start` / `dev` | `dev` uses `bun run build && node dist/cli.mjs` |
| TypeScript sources | `src/` | Large application surface (providers, tools, UI, etc.) |
| VS Code extension | `vscode-extension/openclaude-vscode/` | Separate package with its own `package.json` |
| Python helpers | `python/` | Provider/router utilities with tests |

## Package manifests

- **Root:** `package.json` (`name`: `@gitlawb/openclaude`, `version`: `0.1.7`, `type`: `module`)
- **Extension:** `vscode-extension/openclaude-vscode/package.json`

## Dependency system

- **npm-compatible** dependency graph (`dependencies`, `devDependencies`)
- Lockfile present: `bun.lock` (Bun lockfile; implies Bun-centric workflows upstream)

## Language stacks

- **TypeScript** primary (`tsconfig.json`)
- **React / Ink-style terminal UI** dependencies present (`react`, `react-reconciler`)
- **Python** auxiliary (`python/`)

## Build tools (observed)

- **Bun** invoked by `package.json` scripts (`bun run scripts/build.ts`, many `dev:*` flows)
- **Node** used for `start` (`node dist/cli.mjs`)
- **TypeScript** compiler referenced (`typescript`, `typecheck` script)

## Tests presence

Upstream declares multiple test entrypoints (non-exhaustive):

- `bun test ...` in `test:provider-recommendation`, `test:provider`, and other scripts
- VSCode extension tests: `vscode-extension/openclaude-vscode/src/*.test.js`

**ZAYDEN note:** executing upstream tests is a separate “compatibility harness” phase; not claimed here.

## Documentation presence

- `README.md`, `PLAYBOOK.md`, `SECURITY.md`, `CONTRIBUTING.md`, `docs/*`, platform guides (`ANDROID_INSTALL.md`)

## License / legal signals

- `LICENSE` begins with a **NOTICE** describing proprietary upstream lineage and offering MIT for modifications “where legally permissible”.
- `package.json` declares `"license": "SEE LICENSE FILE"`.

## Missing critical files (relative to “clone and run”)

Nothing obviously missing at the **repository root** for a normal upstream workspace (manifests present). ZAYDEN-specific gap: **no guarantee** your machine has Bun/sharp native toolchain without additional setup.

## Runtime assumptions (high signal)

- **Node:** `engines.node` requires `>=20.0.0` in upstream `package.json`.
- **Bun:** heavily used in scripts; treating Bun as optional is **not** faithful to upstream defaults.
- **Native modules:** `sharp` implies native build artifacts per platform.
- **Network:** provider integrations imply API keys and outbound network (not audited here).

## Integration recommendation

- **Direct merge into ZAYDEN runtime core:** **No**
- **Subprocess / workspace / adapter integration:** **Yes, after** explicit ADRs + policy review + pinned versions + contract tests
