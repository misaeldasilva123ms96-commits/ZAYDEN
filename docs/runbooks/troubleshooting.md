# Troubleshooting runbook

Cross-layer guidance for diagnosing ZAYDEN failures. Prefer **`request_id`** as the correlation key between HTTP access logs and deeper runtime logs.

## 1. Classify the layer

| Symptom | Likely layer | First checks |
| --- | --- | --- |
| `404 NOT_FOUND` on unknown path | API transport | Route list (`/api/chat`, `/api/health`, `/api/readiness`) |
| `400 INVALID_REQUEST` | Public schema / normalizer | Compare body with `runtime/api/schemas/public-chat-request.schema.json` |
| `503` on `/api/readiness` | Readiness gate | Ensure at least one `ProviderAdapter` is registered |
| `503` / `409` / `502` on `/api/chat` with `error_code` | Routing / providers | `docs/architecture/provider-routing.md`, `docs/architecture/resilience-model.md` |
| `500 INTERNAL_ERROR` | Unguarded exception | Server stderr / host logs — response is intentionally non-leaky |

## 2. Read API access lines

Look for JSON lines with `"kind":"zayden.api.access"`:

- **`status_code`** — HTTP outcome.
- **`latency_ms`** — wall time seen at the transport boundary (includes orchestration work for chat).
- **`normalized_error_code`** — populated for errors (including `INVALID_REQUEST`, routing `error_code`, or `NOT_READY`).

Pair with `"kind":"zayden.api.request"` lines sharing the same `request_id`.

## 3. Chat-specific checks

1. **Registry contents** — empty registry yields readiness `503` and chat routing failures.
2. **Mode vs adapters** — `LOCAL_ONLY` requires a healthy local-class adapter; mismatches produce policy or availability errors (never raw adapter stack traces in JSON).
3. **Memory** — if session/persistent memory is enabled, verify `MemoryOrchestrator` wiring; otherwise memory is skipped with `metadata.memory_pipeline.skipped = true`.
4. **Timeouts** — if resilience marks `timeout_triggered`, HTTP maps to **408** for chat failures originating from routing.

## 4. Contract validation failures

If logs mention public schema validation failures inside `buildPublicChatResponse`, treat that as a **bug** (internal state failed to map into the public envelope) rather than a client issue—capture `request_id` and the internal routing summary from server logs.

## 5. Known blind spots

- Public error messages are sanitized/truncated; they do not include stack traces or adapter stderr.
- API logs do not duplicate full `RuntimeInspectionView`; use contract-level tests or internal tooling when deeper fields are required.

## See also

- `docs/runbooks/api-operations.md` — starting the server and limitations  
- `docs/architecture/observability.md` — field dictionary  
- `docs/architecture/runtime-api-surface.md` — lifecycle and error mapping  
