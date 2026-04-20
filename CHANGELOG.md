# Changelog

All notable changes to this repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to **Semantic Versioning** for ZAYDEN-owned packages once published (currently `0.0.0` private scaffold).

## [Unreleased]

### Added

- Phase 2 JSON Schema contracts for chat/provider/tool/error/memory/inspection (`runtime/contracts/*.schema.json`)
- Strict Ajv validation layer (`runtime/contracts/validators.ts`) + TypeScript exports (`runtime/contracts/index.ts`)
- Contract test suite (`tests/contracts/*.test.ts`) + `npm run typecheck`
- Architecture documentation for runtime contracts (`docs/architecture/runtime-contracts.md`)
- ADR for contract versioning posture (`docs/decisions/ADR-0003-runtime-json-contracts-v1.md`)
- Phase 0 forensic audits + source classification matrix (`docs/audits/*`, `docs/audits/SOURCE-CLASSIFICATION-MATRIX.md`)
- Phase 1 foundation repository layout (`apps/`, `runtime/{contracts,providers,tools}`, `tests/`, `docs/{phases,runbooks,providers}`, `.github/workflows/ci.yml`)
- Deterministic intake unpack script targeting `research/` (`scripts/unpack-intake.ps1`)
- Legacy layout migration helper (`scripts/migrate-sources-to-research.ps1`)
- Deterministic intake validator (`scripts/validate-source-intake.mjs`)
- Pinned artifact fingerprint registry (`docs/intake/artifact-hashes.json`)
- Gemma model manifest metadata (`research/source-models/manifests/gemma-2-2b-it-f32.manifest.json`)
- Baseline unit tests (`tests/unit/intake-registry.test.mjs`)
- Root engineering files (`ARCHITECTURE.md`, `ROADMAP.md`, `LICENSE`, `.editorconfig`, `.env.example`)
- Runtime layer scaffolds and observability event schema stub
