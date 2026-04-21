# Host runtime model (Phase 10)

Phase 10 introduces an operational host layer that boots ZAYDEN as a service process while keeping runtime boundaries intact.

## Host/bootstrap architecture

- `runtime/host/config/*`: reads environment, validates enums/flags, applies defaults, returns a normalized `HostConfig`.
- `runtime/host/bootstrap/dependency-container.ts`: explicit composition root that wires runtime modules.
- `runtime/host/bootstrap/runtime-bootstrap.ts`: startup orchestration for loading config, building dependencies, and listening.
- `runtime/host/bootstrap/graceful-shutdown.ts`: signal handling and clean server stop.
- `runtime/host/entrypoints/serve.ts`: executable entrypoint for local/dev/ops.

## Dependency wiring model

`createDependencyContainer(config)` builds dependencies without globals:

1. Contract validators
2. Provider registry + selected local adapter mode
3. Provider gateway + resilience controller + runtime orchestrator
4. Tool registry + builtins + tool orchestrator
5. Session manager + optional persistent memory store + memory orchestrator
6. `RuntimeService` (single runtime entrypoint for transport)
7. API server (`createApiHttpServer`) only when `ENABLE_API=true`

No routing/provider/tool/memory business logic is implemented in host code.

## Config lifecycle

1. `process.env` read in `loadHostConfigFromEnv`.
2. `normalizeHostConfig` validates and normalizes:
   - `HOST`, `PORT`, `NODE_ENV`, `LOG_LEVEL`
   - `ENABLE_API`
   - `ENABLE_PERSISTENT_MEMORY`, `MEMORY_FILE_PATH`
   - `DEFAULT_ROUTING_PROFILE`
   - `LOCAL_PROVIDER_MODE`
   - `READINESS_STRICTNESS`
3. Invalid/missing/conflicting config raises typed `HostConfigError`:
   - `CONFIG_INVALID`
   - `CONFIG_MISSING`
   - `CONFIG_CONFLICT`

## Startup and shutdown flow

Startup (`bootstrapRuntimeHost`):

1. Emit `service.starting`
2. Load config and emit `service.config_loaded`
3. Build dependency container
4. Start API server (if enabled) and emit `service.server_listening`
5. Return boot handle with `stop()`

Shutdown (`registerGracefulShutdown`):

1. Register `SIGINT`/`SIGTERM`
2. On first signal emit `service.shutdown_initiated`
3. Stop accepting connections (`server.close`)
4. Run optional shutdown callback (`boot.stop`)
5. Emit `service.shutdown_completed`
6. Ignore repeated signals except warning (`service.shutdown_already_in_progress`)

## Host vs runtime responsibilities

- **Host owns**: config, dependency wiring, process lifecycle, server start/stop logs.
- **Transport owns**: HTTP request parsing/routing and API envelopes (`runtime/api/*`).
- **RuntimeService owns**: request execution entrypoint from transport.
- **Orchestrators/adapters own**: runtime behavior, routing, resilience, provider/tool/memory execution.

## Limitations

- No built-in auth/rate limiting in host layer (deferred boundary work).
- Local provider mode is single-selection per process boot.
- Readiness strictness is configuration-ready but current readiness semantics remain runtime-owned (`RuntimeService.describeReadiness`).
