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

Runtime JSON contracts (Phase 2) are documented in `docs/architecture/runtime-contracts.md`.

## Current implementation status

- **Phase 0/1 (Forensic intake + foundation):** repository skeleton, `research/` unpack layout, fingerprint registry, intake validator, baseline documentation.
- **Phase 2 (Contract-first runtime):** JSON Schemas + Ajv validators + contract tests (`docs/architecture/runtime-contracts.md`).
- **Phase 3 (Provider gateway):** `ProviderGateway` + adapters + integration tests (`docs/phases/phase-03-provider-gateway.md`, `docs/architecture/openclaude-adaptation-plan.md`).
- **Phase 5 (Deterministic routing):** policy-driven provider selection + explicit fallback orchestration (`docs/architecture/provider-routing.md`).
- **Runtime execution:** not yet implemented as a ZAYDEN-owned service; upstream OpenClaude remains an **isolated research artifact** until a later phase defines adapter boundaries.

## Traceability rule

Any logic derived from imported sources must be traceable via:

- `docs/audits/*-audit.md` and `docs/audits/SOURCE-CLASSIFICATION-MATRIX.md`
- `docs/decisions/ADR-*.md`
- phase reports under `docs/phases/`
