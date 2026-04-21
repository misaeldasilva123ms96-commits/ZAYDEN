# Changelog

All notable changes to this repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to **Semantic Versioning** for ZAYDEN-owned packages once published (currently `0.0.0` private scaffold).

## [Unreleased]

### Added

- F0-F10 release hardening bundle: aggregate `gate:f0-f10`, regression tests (`tests/regression/*`), observability helper test, CI workflow hardening (`npm ci` + release gate), and release artifacts (`docs/release/*`)
- Phase 10 service host boot layer (`runtime/host/*`): validated env config, explicit dependency container, operational bootstrap, `serve` entrypoint, and graceful shutdown hooks (`SIGINT`/`SIGTERM`) with host-level tests and service-host integration (`npm run test:host`, `npm run serve`, `npm run gate:phase10`, ADR-0011, `docs/architecture/host-runtime-model.md`, `docs/runbooks/service-operations.md`)
- Phase 9 external HTTP API surface (`runtime/api/*`, `RuntimeService` in `runtime/core/runtime-service.ts`): public JSON Schemas, thin transport, `POST /api/chat`, `GET /api/health`, `GET /api/readiness`, normalized errors, API access logs (`npm run test:api`, `npm run gate:phase9`, ADR-0010, `docs/architecture/runtime-api-surface.md`, `docs/architecture/observability.md`, `docs/runbooks/api-operations.md`, `docs/runbooks/troubleshooting.md`)
- Phase 8 session + memory framework (`runtime/memory/*`, `MemoryOrchestrator`), policy-gated loading, context budget, in-memory and file persistence adapters, and tests (`npm run test:memory`, ADR-0009, `docs/architecture/memory-model.md`)
- Phase 7 tool layer (`runtime/tools/*`, `ToolOrchestrator`), explicit registry/policy/validator/executor split, builtins (`echo`, `clock`, `fail`), and tests (`npm run test:tools`, ADR-0008, `docs/architecture/tooling-model.md`)
- Phase 6 resilience layer (failure classification, timeout wrapper, bounded retries), deterministic chaos injector, provider harness + scenarios, environment routing profiles, and `RoutingResult.resilience` telemetry mirrored into inspection strings (`docs/architecture/resilience-model.md`, ADR-0007)
- Phase 3 provider gateway (`ProviderRegistry`, `ProviderGateway`, mock + `gemma-local` stub adapters) + core orchestration skeleton
- Phase 4 local provider bridges (`gemma-http`, `gemma-cli`) + shared HTTP/process bridge utilities
- Provider bridge integration tests (`tests/integration/provider-bridge.test.ts`) and docs (`docs/providers/bridge-local-runtime.md`)
- ADR-0005 for execution bridge isolation and normalized provider errors
- Phase 5 deterministic routing policy layer (`runtime/providers/routing/*`) + runtime orchestrator
- Routing unit/integration coverage (`tests/unit/routing-policy.test.ts`, `tests/unit/fallback-policy.test.ts`, `tests/integration/provider-routing.test.ts`)
- ADR-0006 and architecture guide for observable fallback routing (`docs/architecture/provider-routing.md`)
- OpenClaude adaptation framing doc (`docs/architecture/openclaude-adaptation-plan.md`) + ADR-0004
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
