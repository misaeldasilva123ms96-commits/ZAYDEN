# Runtime contracts (Phase 2) — design and usage

This document describes the **ZAYDEN-owned**, **provider-agnostic** JSON contracts introduced in Phase 2. These contracts are intentionally defined **without** importing or mirroring upstream product code under `research/`.

## Goals

- **JSON-serializable** end-to-end (wire/logging/persistence friendly)
- **Versioned** via `contract_version` fields (currently `1.0.0`)
- **Strict** at the boundary: unknown top-level keys are rejected where `additionalProperties: false`
- **Forward-compatible** inside policy objects via controlled `metadata` bags with `additionalProperties: true`
- **Testable** with Ajv strict compilation + contract tests under `tests/contracts/`

## Artifact layout

| Artifact | Path |
| --- | --- |
| Chat request | `runtime/contracts/chat-request.schema.json` |
| Chat response | `runtime/contracts/chat-response.schema.json` |
| Provider request | `runtime/contracts/provider-request.schema.json` |
| Provider response | `runtime/contracts/provider-response.schema.json` |
| Tool call | `runtime/contracts/tool-call.schema.json` |
| Runtime inspection | `runtime/contracts/runtime-inspection.schema.json` |
| Error envelope | `runtime/contracts/error-envelope.schema.json` |
| Memory context | `runtime/contracts/memory-context.schema.json` |
| TypeScript API | `runtime/contracts/index.ts`, `runtime/contracts/validators.ts` |

## Versioning strategy

1. **Patch-level JSON tweaks** that do not change required fields may bump schema text but should keep `contract_version` until a coordinated migration exists.
2. **Any breaking change** (required field add/remove/rename, enum membership change) must:
   - bump `contract_version` (e.g. `1.0.0` → `1.1.0`)
   - update Ajv schemas + tests + this document
   - add an ADR describing migration and compatibility windows
3. **Runtime may accept older versions** only via explicit adapter modules in a future phase (not implemented here).

## Chat request (`chat-request.schema.json`)

### Required top-level fields

- `contract_version` — must be `1.0.0`
- `session_id` — non-empty string correlation for the session/turn
- `input` — user text for this turn
- `system_policy` — object with required `contract_version` plus optional `safety` bag (forward extensible)
- `tool_policy` — object with required `contract_version` plus optional allowlists/flags
- `memory_context` — must validate against `memory-context.schema.json`
- `requested_mode` — one of `LOCAL_ONLY | CLOUD_ONLY | HYBRID | SAFE_FALLBACK`
- `metadata` — object with required `contract_version` for client trace/feature flags

### Optional

- `requested_provider` — string or `null` (explicit ask; routing may override)

### Example (valid)

```json
{
  "contract_version": "1.0.0",
  "session_id": "sess-9f3c",
  "input": "Explain the ZAYDEN contracts.",
  "system_policy": {
    "contract_version": "1.0.0",
    "safety": { "redact_pii": true }
  },
  "tool_policy": {
    "contract_version": "1.0.0",
    "allow_tools": true,
    "allowed_tool_names": ["read_file"]
  },
  "memory_context": {
    "contract_version": "1.0.0",
    "entries": [
      { "id": "m1", "role": "user", "text": "Earlier context..." }
    ]
  },
  "requested_mode": "HYBRID",
  "requested_provider": null,
  "metadata": { "contract_version": "1.0.0", "trace_id": "tr-42" }
}
```

## Chat response (`chat-response.schema.json`)

### Required top-level fields

- `contract_version`
- `session_id`
- `output` — assistant text (normalized at this boundary)
- `runtime_mode` — same enum set as requested mode (actual outcome)
- `provider_requested` — string or `null`
- `provider_actual` — `{ kind, name, model }` with enumerated `kind`
- `model` — resolved model id (may duplicate `provider_actual.model`)
- `fallback_reason` — `null` or `{ did_fallback, code?, detail? }`
- `tool_calls` — array of `tool-call.schema.json` items
- `observability` — must validate as `runtime-inspection.schema.json`
- `usage` — token accounting object (`contract_version` required)
- `error` — `null` or full `error-envelope.schema.json`

### Optional

- `safety` — forward-compatible annotations from policy engines

### Example (valid)

```json
{
  "contract_version": "1.0.0",
  "session_id": "sess-9f3c",
  "output": "Contracts are JSON-schema-first...",
  "runtime_mode": "SAFE_FALLBACK",
  "provider_requested": "local_gguf",
  "provider_actual": { "kind": "ollama", "name": "local", "model": "qwen2.5" },
  "model": "qwen2.5",
  "fallback_reason": {
    "did_fallback": true,
    "code": "LOCAL_UNAVAILABLE",
    "detail": "No local runtime healthy; used cloud stub."
  },
  "tool_calls": [],
  "observability": {
    "contract_version": "1.0.0",
    "runtime_mode": "SAFE_FALLBACK",
    "execution_path": ["POLICY_CHECK", "ROUTE", "RESPOND"],
    "provider_chain": [
      { "name": "local", "kind": "local_gguf" },
      { "name": "cloud", "kind": "openai_compatible" }
    ],
    "fallback_triggered": true,
    "tool_execution_count": 0,
    "latency_ms": 183,
    "warnings": ["fallback_used"]
  },
  "usage": {
    "contract_version": "1.0.0",
    "input_tokens": 120,
    "output_tokens": 90,
    "total_tokens": 210,
    "provider_usage": {}
  },
  "error": null
}
```

### Example (error present)

```json
{
  "contract_version": "1.0.0",
  "session_id": "sess-9f3c",
  "output": "",
  "runtime_mode": "CLOUD_ONLY",
  "provider_requested": "cloud",
  "provider_actual": { "kind": "unknown", "name": "unconfigured", "model": null },
  "model": null,
  "fallback_reason": null,
  "tool_calls": [],
  "observability": {
    "contract_version": "1.0.0",
    "runtime_mode": "CLOUD_ONLY",
    "execution_path": ["POLICY_CHECK", "FAIL_FAST"],
    "provider_chain": [],
    "fallback_triggered": false,
    "tool_execution_count": 0,
    "latency_ms": 3,
    "warnings": []
  },
  "usage": {
    "contract_version": "1.0.0",
    "input_tokens": null,
    "output_tokens": null,
    "total_tokens": null
  },
  "error": {
    "contract_version": "1.0.0",
    "error_type": "PROVIDER_NOT_CONFIGURED",
    "message": "No provider credentials available.",
    "origin": "runtime",
    "recoverable": true,
    "metadata": { "hint": "run provider onboarding" }
  }
}
```

## Provider request/response

These envelopes describe a **normalized** provider hop:

- **Request** carries `correlation_id`, `session_id`, a `payload.messages[]` list, and serializable `parameters`.
- **Response** carries `provider_actual`, `text`, `usage`, and optional `raw_metadata` for opaque logging.

They intentionally do **not** embed vendor SDK types.

## Tool call (`tool-call.schema.json`)

Serializes a single tool invocation boundary: id, name, arguments, status, optional `result` bag.

## Runtime inspection (`runtime-inspection.schema.json`)

Structured observability required by chat responses:

- `runtime_mode`, `execution_path[]`, `provider_chain[]`, `fallback_triggered`, `tool_execution_count`, `latency_ms`, `warnings[]`

## Error envelope (`error-envelope.schema.json`)

Cross-cutting error shape with `origin` discrimination (`runtime | provider | tool`) and `recoverable` hint.

## Memory context (`memory-context.schema.json`)

Typed slice used inside chat requests; keeps memory extensible via `metadata` and optional `entries[]`.

## TypeScript validation API

`createContractValidators()` returns compiled Ajv validators. Prefer `outcome()` in tests and boundary code to avoid throwing.

## Gate (Phase 2)

**PASS** only if:

- all schemas exist and `$ref` graphs compile
- `npm run typecheck` passes
- `npm run test:contracts` passes

No provider implementations are part of this phase.
