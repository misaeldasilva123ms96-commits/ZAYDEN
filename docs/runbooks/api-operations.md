# API operations runbook

Operational guidance for the Phase 9 HTTP surface (`runtime/api/*` + `runtime/core/runtime-service.ts`).

## How to start the server

There is no separate long-lived binary in-repo; embed the HTTP server in a small host (CLI, worker, or test harness):

```typescript
import { createApiHttpServer, listenApiServer } from "./runtime/api/transport/http-server.js";
import { RuntimeService } from "./runtime/core/runtime-service.js";
// … construct ProviderRegistry, ProviderGateway, RuntimeOrchestrator, optional MemoryOrchestrator …

const runtimeService = new RuntimeService({ orchestrator, registry /*, memoryOrchestrator */ });
const server = createApiHttpServer({ runtimeService });
await listenApiServer(server, 8787, "127.0.0.1");
```

Use `listenApiServer(server, 0)` to bind an ephemeral port in tests.

## Environment and configuration

- **Node**: `>=18.18.0` (see root `package.json`).
- **Composition**: All behavior gates on injected dependencies (`RuntimeOrchestrator`, `ProviderRegistry`, optional `MemoryOrchestrator`). Environment-specific adapter configuration should be resolved **before** constructing `RuntimeService`, not inside HTTP handlers.
- **CORS / TLS / auth**: Out of scope for Phase 9; terminate TLS and authenticate at a reverse proxy or future boundary without changing `runtime/api` contracts.

## Health and readiness

| Endpoint | Expected | Meaning |
| --- | --- | --- |
| `GET /api/health` | `200` + `{ status: "ok", request_id }` | Process alive |
| `GET /api/readiness` | `200` when adapters exist; `503` when registry empty | Minimal capacity to serve `/api/chat` |

Readiness intentionally ignores optional providers; treat optional subsystem health via separate ops checks.

## Troubleshooting request failures

1. **Note `request_id`** from the JSON body (success, error, and readiness responses).
2. **Correlate access logs**: Lines with `kind":"zayden.api.access"` include `status_code`, `latency_ms`, and `normalized_error_code`.
3. **400 `INVALID_REQUEST`**: Fix payload against `runtime/api/schemas/public-chat-request.schema.json`.
4. **409 / 503 from chat**: Usually routing or provider availability; see `error_code` and `message` (public-safe). Compare with internal routing docs (`docs/architecture/provider-routing.md`, `docs/architecture/resilience-model.md`).
5. **500 `INTERNAL_ERROR`**: Unexpected exception path; investigate server logs (stdout/stderr), not the client response (no stack in JSON).

See also `docs/runbooks/troubleshooting.md` for cross-layer diagnosis.

## Known limitations

- No built-in authentication, rate limiting, or WebSocket streaming in this phase.
- Chat handler body limit is fixed at 512 KiB.
- Public error messages are sanitized and truncated for safety; they are not a substitute for internal logs.

## Verification commands

```bash
npm run typecheck
npm run test:api
npm run gate:phase9
```
