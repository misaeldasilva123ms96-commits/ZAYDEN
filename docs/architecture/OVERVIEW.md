# ZAYDEN — Architecture overview

ZAYDEN is a **governed integration program** for building a modular AI runtime. The program is intentionally staged: each phase introduces gates (tests, documentation, provenance) before deeper integration.

## North-star properties

- Multi-provider capable (cloud + local + hybrid)
- Provider-agnostic contracts at boundaries
- Observability-first runtime instrumentation
- Deterministic validation gates (local + CI)
- Fail-safe fallback behavior (designed incrementally; not claimed complete in Phase 1)

## Layered model (target)

The authoritative layer decomposition lives in `docs/architecture/LAYER-MODEL.md`.

## Current implementation status

- **Phase 1 (Source Intake):** repository skeleton, intake unpack script, fingerprint registry, intake validator, baseline documentation, and contract stubs under `runtime/core/`.
- **Runtime execution:** not yet implemented as a ZAYDEN-owned service; upstream `openclaude-main` remains an **isolated intake artifact** until a later phase defines adapter boundaries.

## Traceability rule

Any logic derived from imported sources must be traceable via:

- `docs/audits/SOURCE-*.md`
- `docs/decisions/ADR-*.md`
- phase reports under `docs/intake/`
