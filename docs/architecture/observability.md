# Observability model

ZAYDEN separates **transport-level** logs from **runtime-path** telemetry so each layer stays inspectable without duplicating business logic.

## Required runtime-path fields

These fields appear on successful public chat responses (see `buildPublicChatResponse`) and/or internal `RoutingResult.observability` / inspection views:

| Field | Description | Primary source |
| --- | --- | --- |
| `runtime_mode` | Effective routing mode used for the turn | `RoutingResult.runtime_mode` |
| `provider_requested` | Declared or inferred provider preference | `RoutingResult.provider_requested` |
| `provider_actual` | Adapter that produced the output (sanitized: kind, name, model) | `RoutingResult.provider_actual` |
| `fallback_reason` | Whether fallback occurred + stable code | `RoutingResult.fallback_reason` |
| `tool_calls` | Summary list (names + status); empty when tools disabled | Tool orchestration (future enrichment); currently stable empty summary |
| `latency_ms` | End-to-end time for the service call | Measured in `RuntimeService.executeChat` |
| `response_source` | Constant `"runtime"` for API-originated successes | Response normalizer |
| `error_type` | Present on degraded routing outcomes | `RoutingResult.error` |
| `memory_hits` | Count derived from memory load observation | `MemoryLoadObservation` when memory ran; else `0` |
| `session_id` | Correlates multi-turn traffic | Public + internal session id |

Internal-only strings (for example lines prefixed `RESILIENCE:`) are filtered from **public** `warnings` but remain available in internal inspection contracts where appropriate.

## Structured logging

### API boundary

- **`zayden.api.request`** — emitted at the start of dispatch (`middleware/request-logging.ts`): `request_id`, `route`, `method`, optional `session_id`.
- **`zayden.api.access`** — emitted after each response (`observability/api-logger.ts`): `request_id`, `route`, `method`, `status_code`, `latency_ms`, `normalized_error_code`, optional `session_id`.

These logs answer: *Did the edge accept the request, how long did the HTTP layer take, and what status/error class was returned?*

### Runtime / contracts

- Internal chat/provider flows continue to use `runtime/contracts` validation and `RuntimeInspectionView` (`runtime-inspection.schema.json`) where orchestration already records deterministic inspection data.

## Runtime inspection object

The canonical structured snapshot for orchestrated turns remains the **contractual** `RuntimeInspectionView` attached to internal responses (see `runtime/contracts/runtime-inspection.schema.json` and `RuntimeOrchestrator`). The **public** HTTP envelope intentionally exposes a **subset** via `buildPublicChatResponse` so external clients receive stable telemetry without adapter-specific payloads.

## Response metadata

Public chat responses include a `metadata` object with transport-safe summaries (for example routing fallback flag, memory pipeline summary). This is not a second runtime; it is a **projection** of internal observations already computed during orchestration.

## Related material

- API boundary specifics: `docs/architecture/runtime-api-surface.md`
- Operational triage: `docs/runbooks/troubleshooting.md`
