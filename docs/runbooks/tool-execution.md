# Tool execution runbook

## How to register tools

Use `ToolRegistry` from `runtime/tools/registry/tool-registry.ts` and register each `ToolDefinition`. For the built-in reference tools (`echo`, `clock`, `fail`), call `registerBuiltinTools(registry)` from `runtime/tools/builtins/register-builtins.ts`.

## How to execute safely

Always construct `ToolOrchestrator` (`runtime/core/tool-orchestrator.ts`) with contract validators plus a registry, then call `executeToolCall` with:

- `chat_tool_policy` — the `tool_policy` object from an incoming chat request (must include `contract_version: "1.0.0"`).
- `tool_call` — raw pending tool call (validated against `tool-call.schema.json`).
- `session_id` / optional `correlation_id`.
- Optional `timeout_ms` (defaults to 30s) and optional `clock_ms` for deterministic clock tests.

Do **not** call `ToolDefinition.execute` directly from application code — that bypasses policy, argument schema validation, timeouts, and observability.

## Debugging

- Read `observation.execution_path` for ordered milestones (`TOOL_ORCH_START`, `TOOL_ARGS_VALID`, `TOOL_EXECUTE_*`, …).
- Read `tool_call.status` and `tool_call.result.kind` (`tool_success` vs `tool_error`).
- For `tool_error`, validate the nested envelope with `validateErrorEnvelope` during diagnostics.

## Limits (Phase 7)

- One invocation per `executeToolCall` — no implicit tool loops.
- Memory/UI integration is out of scope for this phase.
