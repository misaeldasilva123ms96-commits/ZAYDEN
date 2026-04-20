# OpenClaude-based core adaptation — plan (Phase 3 companion)

This document satisfies the **OpenClaude adaptation gate**: clear boundaries, no chaotic copying.

## Principles

- **Contracts first:** all cross-boundary payloads remain Phase 2 JSON Schemas (`runtime/contracts/*.schema.json`).
- **Adapter-only coupling:** any OpenClaude-derived behavior enters ZAYDEN only through **wrappers** (subprocess, HTTP bridge, or narrow facades), never as raw imports from `research/source-openclaude/`.
- **No SDK types in contracts:** vendor SDK shapes stop at adapter private code (future), not in `runtime/contracts/`.

## Architecture inspection summary (high level)

OpenClaude (unpacked under `research/source-openclaude/`) is a **large TypeScript CLI** with:

- a **CLI entry** (`bin/`, `dist/cli.mjs` when built) and `src/` orchestration
- **provider modules** under `src/` (multiple backends, streaming, auth)
- **tooling / MCP / terminal UI** concerns tightly coupled to the product

ZAYDEN intentionally keeps a **smaller core**: contracts → provider gateway → (future) orchestration.

## Module mapping (conceptual)

| OpenClaude area (research tree) | ZAYDEN destination | Integration style |
| --- | --- | --- |
| Provider client modules (`src/services/api/*`, related) | `runtime/providers/adapters/*` (future `openclaude-bridge` adapter) | Wrapper translating `ProviderRequest` ↔ OpenClaude internal calls |
| CLI / Ink UI | `apps/cli` (future) | Optional separate process; no import from research into `runtime/core` |
| Tool runner / permissions | `runtime/tools` (Phase 4+) | Re-implement policy using ZAYDEN contracts; compare behavior with OC tests as **parity fixtures** only |
| Config / profiles | `runtime/core` config facades (future) | Read-only mapping into ZAYDEN metadata objects |

## Gap analysis (source vs ZAYDEN)

| Dimension | OpenClaude | ZAYDEN (current) | Gap / mitigation |
| --- | --- | --- | --- |
| Dependency model | Bun-heavy build, large `node_modules` | Pure Node + TS for core; Ajv contracts | Future adapter may spawn `openclaude` binary or isolate in child workspace |
| Provider surface | Many providers + streaming | `ProviderRequest` / `ProviderResponse` normalized | Add streaming as **v2 contract** via ADR (non-goal today) |
| Tooling | Built-in tool ecosystem | Not implemented | Keep out of Phase 3 gateway |
| Observability | Rich internal telemetry | `runtime-inspection` contract | Map OC telemetry into inspection objects at boundary |

## Initial runtime orchestration skeleton

See `runtime/core/orchestrator-skeleton.ts` — wires `createContractValidators()` + `ProviderRegistry` + `ProviderGateway` with a **mock** adapter only.

## Gate statement

**PASS** for adaptation planning if:

- this document exists and links to code boundaries (`runtime/providers/registry/*`, `runtime/core/orchestrator-skeleton.ts`)
- no `research/` imports appear in `runtime/contracts`, `runtime/providers`, or `runtime/core`
