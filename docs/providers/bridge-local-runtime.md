# Local Runtime Bridge (Gemma)

This document describes the **adapter-only** bridge execution paths for local models.

## Supported modes

- **HTTP bridge** (`gemma-http.adapter.ts`)  
  Targets local runtimes exposing an HTTP API (for example Ollama at `http://localhost:11434`).
- **CLI bridge** (`gemma-cli.adapter.ts`)  
  Spawns a local binary/CLI and normalizes stdout into `ProviderResponse`.
- **Simulated fallback** (`gemma-http.adapter.ts`, when enabled)  
  Used when local runtime is unavailable; still returns a contract-valid response with latency + failure metadata.

## Environment configuration

- `ZAYDEN_LOCAL_HTTP_ENDPOINT` (default: `http://127.0.0.1:11434`)
- `ZAYDEN_LOCAL_MODEL_NAME` (default bridge model id)
- `ZAYDEN_GGUF_PATH` / `ZAYDEN_GGUF_ZIP_PATH` (asset hints)
- `ZAYDEN_GEMMA_CLI_CMD` (path to CLI binary for subprocess bridge)

## Health checks

`gemma-local.health.ts` marks health as usable when at least one is true:

- endpoint reachable
- CLI binary exists
- GGUF env configured

The gateway decides availability from adapter `isAvailable()`; no routing logic is embedded.

## Request mapping example

`ProviderRequest.payload.messages[]` -> prompt derivation (last `user` message preferred)

```json
{
  "contract_version": "1.0.0",
  "correlation_id": "corr-bridge-0001",
  "session_id": "sess-bridge-1",
  "payload": {
    "messages": [
      { "role": "user", "content": "say hello" }
    ]
  },
  "parameters": { "temperature": 0.1, "max_output_tokens": 64 }
}
```

## Response mapping example (simulated fallback)

```json
{
  "contract_version": "1.0.0",
  "correlation_id": "corr-bridge-0001",
  "session_id": "sess-bridge-1",
  "provider_actual": { "kind": "local_gguf", "name": "gemma-http", "model": "gemma2:2b" },
  "model": "gemma2:2b",
  "text": "[simulated-local:gemma2:2b] say hello",
  "finish_reason": "stop",
  "usage": {
    "contract_version": "1.0.0",
    "input_tokens": null,
    "output_tokens": null,
    "total_tokens": null,
    "provider_usage": { "bridge_mode": "simulated", "execution_time_ms": 42 }
  },
  "raw_metadata": {
    "execution_time_ms": 42,
    "failure_reason": "endpoint_unreachable",
    "simulated": true
  }
}
```

## Failure cases

- endpoint non-2xx
- malformed JSON / missing required provider payload fields
- CLI non-zero exit or empty stdout

All adapter failures are raised as `ProviderExecutionError` carrying a normalized provider error envelope:

- `error_type = PROVIDER_EXECUTION_ERROR`
- `origin = provider`
- `recoverable = true/false`
- `metadata` includes `execution_time_ms` + `failure_reason`

## Troubleshooting

- Ensure local runtime is started (`ollama serve` or equivalent).
- Check endpoint reachability (`curl http://127.0.0.1:11434`).
- Verify env vars and file paths for GGUF/CLI.
- Run integration tests:
  - `npm run test:integration`
  - `npm run gate:phase4`
