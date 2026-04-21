# Service operations runbook

Operational guide for running the Phase 10 host entrypoint.

## How to run locally

Use the host entrypoint:

```bash
npm run serve
```

The process starts the API server when `ENABLE_API=true` (default).

## Environment variables

Required behavior is configuration-validated. Defaults are safe for local development.

| Variable | Default | Notes |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `8787` | Use `0` for ephemeral test port |
| `NODE_ENV` | `development` | `development` / `test` / `production` |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `ENABLE_API` | `true` | Disable to boot dependencies without binding HTTP |
| `ENABLE_PERSISTENT_MEMORY` | `false` | Enables file memory store wiring |
| `MEMORY_FILE_PATH` | `.zayden-memory` (when persistent enabled) | Invalid if set while persistent memory disabled |
| `DEFAULT_ROUTING_PROFILE` | inferred from `NODE_ENV` | `development` / `testing` / `production` |
| `LOCAL_PROVIDER_MODE` | `mock` | `mock`, `gemma-local`, `gemma-http`, `gemma-cli` |
| `READINESS_STRICTNESS` | `lenient` | Reserved host config for readiness policy tuning |

## Startup examples

Local mock mode:

```bash
LOCAL_PROVIDER_MODE=mock npm run serve
```

HTTP bridge mode:

```bash
LOCAL_PROVIDER_MODE=gemma-http ZAYDEN_LOCAL_HTTP_ENDPOINT=http://127.0.0.1:11434 npm run serve
```

Persistent memory:

```bash
ENABLE_PERSISTENT_MEMORY=true MEMORY_FILE_PATH=.zayden-memory npm run serve
```

## Shutdown behavior

- Handles `SIGINT` and `SIGTERM`.
- Stops accepting new HTTP connections via `server.close`.
- Executes host shutdown callback.
- Exits with `0` on clean shutdown, `1` on shutdown failure.
- Repeated shutdown signals are ignored safely after first initiation.

## Health/readiness expectations

- `GET /api/health`: liveness only.
- `GET /api/readiness`: runtime-owned readiness semantics from `RuntimeService`; host config does not hardcode readiness logic.

## Troubleshooting boot failures

Configuration failures are typed and fail fast:

- `CONFIG_MISSING`: empty required value (for example `PORT=""`)
- `CONFIG_INVALID`: invalid enum/number/boolean
- `CONFIG_CONFLICT`: incompatible flags (for example `MEMORY_FILE_PATH` set while persistent memory disabled)

Checks:

1. Validate env spelling/casing.
2. Confirm `PORT` is numeric.
3. Confirm `LOCAL_PROVIDER_MODE` is one of supported values.
4. For persistent memory, ensure `ENABLE_PERSISTENT_MEMORY=true`.

Related docs:

- `docs/architecture/host-runtime-model.md`
- `docs/architecture/runtime-api-surface.md`
- `docs/runbooks/troubleshooting.md`
