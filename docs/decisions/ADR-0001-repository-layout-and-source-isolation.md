# ADR-0001 — Repository layout and source isolation boundaries

- Status: Accepted
- Date: 2026-04-20
- Owners: ZAYDEN core maintainers

## Context

ZAYDEN is a governed integration program assembling multiple third-party assets (OpenClaude, claw-code, a partial `src/` tree, reference prompt collections, and a local GGUF model). The primary risk is accidental creation of an unmaintainable monolith mixing incompatible dependency models, unclear ownership, and un-auditable provenance.

## Decision

1. **Operational base candidate (not yet merged into a ZAYDEN-owned runtime implementation):** `sources/intake/openclaude-main/` unpacked from `openclaude-main.zip`.
2. **Harness inspiration (isolated):** `sources/intake/claw-code-main/`.
3. **Architecture study material (explicitly incomplete):** `sources/study/src/` unpacked from `src.zip`.
4. **Reference-only research material (non-trusted baseline):** `sources/reference/system-prompts-leaks/` unpacked from `system_prompts_leaks-main.zip`, governed by `docs/audits/REFERENCE-system-prompts-leaks.md`.
5. **Model asset metadata (not the binary):** `sources/models/manifests/` contains machine-readable manifests; large archives remain local-only by default (`.gitignore`).

## Rationale

- **Composition over invasive fusion:** upstream trees remain traceable and replaceable; ZAYDEN-owned code will live under `runtime/` and future `packages/*` without rewriting upstream internals until a phase explicitly approves an adapter boundary.
- **Maintainability / observability / testability:** a deterministic intake validator (`scripts/validate-source-intake.mjs`) provides an auditable gate with explicit fingerprints (`docs/intake/artifact-hashes.json`).
- **Cleaner repository state:** unpacked third-party trees are intentionally gitignored to avoid committing multi-thousand-file snapshots; reproducibility is preserved via pinned zip hashes + `scripts/unpack-intake.ps1`.

## Consequences

- Fresh clones require a one-time unpack step before intake gates pass.
- CI must either (a) cache unpacked trees as build artifacts, or (b) run unpack from committed zips when legally permissible.

## Non-goals (Phase 1)

- No claim that ZAYDEN runtime is “production-ready.”
- No incorporation of reference prompt text into product logic.
