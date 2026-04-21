# Tooling model (runtime)

Phase 7 introduces a **governed tool execution layer** that stays separate from provider routing and resilience.

## Separation of concerns

| Component | Responsibility |
| --- | --- |
| `ToolRegistry` | Catalog of `ToolDefinition` instances (explicit registration only). |
| `ToolPolicy` / `permission-resolver` | Interprets chat `tool_policy` and answers allow/deny for a tool name. |
| `ToolInvocationValidator` | Validates `tool-call` envelope (Ajv) and optional per-tool `inputSchema`. |
| `ToolExecutor` | The only module that invokes `ToolDefinition.execute`, wrapped with `withTimeout`. |
| `ToolOrchestrator` | Composes policy → validation → execution and emits a structured observation trace. |

Tools **must not** self-authorize. Callers must route invocations through `ToolOrchestrator.executeToolCall`.

## Policy semantics (deterministic)

`resolveChatToolPolicy` interprets `chat-request.tool_policy`:

- `allow_tools === false` → deny all tools.
- Otherwise, only names listed in `allowed_tool_names` may run.
- Missing or empty `allowed_tool_names` → deny all (explicit allowlist required).

This matches conservative defaults: an empty allowlist never implies “open mode”.

## Results and errors

- Successful tools return `ToolResult` `{ ok: true, payload }`, normalized into `tool_call.result` with `kind: "tool_success"`.
- Failures return either structured `{ ok: false, ... }` from the tool or normalized exceptions/timeouts from `ToolExecutor`, embedded as `kind: "tool_error"` with an inner object compatible with `error-envelope.schema.json`.

## Observability

`ToolExecutionObservation` captures `permission`, `validation_ok`, `executed`, `duration_ms`, optional `error_code`, and an ordered `execution_path` built from explicit `emit` events.

## Builtins

`echo`, `clock`, and `fail` are reference implementations under `runtime/tools/builtins/`. Register them with `registerBuiltinTools(registry)` in tests or future wiring.
