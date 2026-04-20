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

- **Phase 0/1 (Forensic intake + foundation):** repository skeleton, `research/` unpack layout, fingerprint registry, intake validator, baseline documentation, and contract stubs under `runtime/contracts/`.
- **Runtime execution:** not yet implemented as a ZAYDEN-owned service; upstream OpenClaude remains an **isolated research artifact** until a later phase defines adapter boundaries.

## Traceability rule

Any logic derived from imported sources must be traceable via:

- `docs/audits/*-audit.md` and `docs/audits/SOURCE-CLASSIFICATION-MATRIX.md`
- `docs/decisions/ADR-*.md`
- phase reports under `docs/phases/`
