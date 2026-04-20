# ZAYDEN architecture (root index)

This file is the **entrypoint** for architecture navigation.

## Canonical documentation

- **System architecture (layers, boundaries):** `docs/architecture/OVERVIEW.md` and `docs/architecture/LAYER-MODEL.md`
- **Phased execution reports:** `docs/phases/`
- **Forensic audits (Phase 0):** `docs/audits/*-audit.md` and `docs/audits/SOURCE-CLASSIFICATION-MATRIX.md`
- **Operational runbooks:** `docs/runbooks/`

## Repository layout (Phase 1 foundation)

- **Applications (future):** `apps/cli`, `apps/api`, `apps/ui`
- **ZAYDEN-owned runtime:** `runtime/{core,contracts,providers,tools,memory,observability}`
- **Upstream/reference material (unpacked, gitignored):** `research/source-*`
- **Tests:** `tests/{unit,integration,contracts,regression,fixtures,mocks}`

## Engineering stance

ZAYDEN is built as a **governed integration program**: upstream trees remain isolated until adapter boundaries, tests, and ADRs justify deeper coupling.
