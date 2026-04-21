# Phase 9 — Runtime API surface

**Status:** complete  
**Goal:** Expose ZAYDEN as an **externally consumable** governed runtime service without collapsing transport into orchestration.

## Deliverables

- Thin HTTP transport: `runtime/api/transport/*`, `runtime/api/handlers/*`
- Public JSON Schemas + Ajv validators: `runtime/api/schemas/*`, `runtime/api/normalization/public-validators.ts`
- Request/response normalization: `request-normalizer.ts`, `response-normalizer.ts`, `api-errors.ts`
- Request-scoped context + structured access logging: `request-context.ts`, `middleware/request-logging.ts`, `observability/api-logger.ts`
- Single internal entrypoint from HTTP: `runtime/core/runtime-service.ts` (`RuntimeService`)
- Endpoints: `POST /api/chat`, `GET /api/health`, `GET /api/readiness`
- Tests: `tests/api/*`, `tests/integration/runtime-service.test.ts`
- Documentation: `docs/architecture/runtime-api-surface.md`, `docs/runbooks/api-operations.md`, `docs/decisions/ADR-0010-runtime-api-boundary.md`, `docs/architecture/observability.md`, `docs/runbooks/troubleshooting.md`

## Gate checklist

- [x] Handlers do not implement routing, resilience, or memory logic directly.
- [x] Public request bodies validated; no raw pass-through to orchestrators.
- [x] Public responses and errors normalized; no stack traces in JSON.
- [x] `request_id` present on success, error, health, and readiness payloads where applicable.
- [x] Readiness reflects registered adapters only (minimal bar).
- [x] Intake validator extended with Phase 9 artifact list (`scripts/validate-source-intake.mjs`).
- [x] `npm run gate:phase9` runs typecheck, full tests (including API), and intake validation.

## Follow-ups (non-blocking)

- Optional auth middleware stub (isolated from orchestration).
- Streaming/SSE design as a separate transport profile.
- Dedicated CLI entry that hosts `createApiHttpServer` for local demos.
