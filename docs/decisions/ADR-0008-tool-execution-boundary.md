# ADR-0008 — Tool execution boundary

## Status

Accepted (Phase 7).

## Context

ZAYDEN has strict contracts for chat/tool-call/error envelopes and a separate provider orchestration layer. Tools must not become a backdoor that bypasses policy, observability, or schema validation.

## Decision

1. Introduce a dedicated **`runtime/tools`** tree with a **`ToolOrchestrator`** as the only supported execution entrypoint for Phase 7.
2. Enforce **explicit allowlists** derived from `chat-request.tool_policy` (`allowed_tool_names` non-empty when tools are enabled).
3. Validate pending `tool-call` payloads with existing Ajv validators; optionally validate `arguments` with per-tool JSON Schema compiled at first use.
4. Wrap tool execution with **`withTimeout`** from the resilience timeout controller to avoid hung tools.
5. Normalize outputs into `tool_call.result` objects with explicit `kind` discriminators while embedding `error-envelope`-compatible objects for failures.

## Consequences

- Positive: tools are testable, policy-gated, and observable without touching provider routing.
- Negative: higher-level runtimes must thread `ToolOrchestrator` explicitly until a future runtime API phase centralizes wiring.
