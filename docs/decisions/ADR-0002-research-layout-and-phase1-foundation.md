# ADR-0002 — `research/` layout + Phase 1 foundation structure

- Status: Accepted
- Date: 2026-04-20
- Supersedes: portions of the folder layout implied by ADR-0001’s examples (`sources/intake` as canonical)

## Context

The phased execution program requires:

- forensic audits with canonical naming
- a professional repository skeleton (`apps/`, `runtime/*`, `tests/*`, `docs/*`, `.github/workflows/`)

ADR-0001 remains valid philosophically (isolation, composition, gates), but the **physical layout** must match the updated program.

## Decision

1. Canonical unpacked upstream trees live under `research/source-*` (gitignored).
2. ZAYDEN-owned runtime contracts live under `runtime/contracts/` (committed).
3. Provider and tool scaffolds use names `runtime/providers/` and `runtime/tools/`.
4. Tests live under `tests/` (not `test/`).
5. Phase documentation lives under `docs/phases/`.

## Consequences

- Developers may need a one-time `npm run intake:migrate` if they still have the legacy `sources/*` layout locally.
- CI can run `npm test` without unpacking upstream trees.

## Follow-ups

- Phase 2 should introduce provider interfaces under `runtime/providers/` with contract tests under `tests/contracts/`.
