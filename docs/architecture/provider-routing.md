# Provider Routing Architecture (Phase 5)

## Routing model overview

ZAYDEN separates responsibilities:

- **adapter** = execution bridge (`runtime/providers/adapters/*`)
- **registry** = provider catalog (`runtime/providers/registry/provider-registry.ts`)
- **router/orchestrator** = decision logic (`runtime/core/runtime-orchestrator.ts`)

Routing consumes policy + mode + availability and emits deterministic selection outcomes.

## Mode semantics

- `LOCAL_ONLY`
  - only local provider kinds are considered (`local_gguf`, `ollama`)
  - if no successful local provider, fail with normalized runtime error
  - no cloud fallback when `strict_local_only=true`
- `CLOUD_ONLY`
  - only cloud provider kinds are considered (`openai_compatible`, `gemini`)
  - if no successful cloud provider, fail with normalized runtime error
  - no local fallback when `strict_cloud_only=true`
- `HYBRID`
  - starts from configured preferred provider class (`hybrid_preference`)
  - can fall back according to declarative `fallback_order`
- `SAFE_FALLBACK`
  - attempts preferred provider then safe alternatives from `fallback_order`
  - fallback remains explicit and visible

## Fallback semantics

Fallback is controlled by `fallback-policy.ts`:

- never implicit
- gated by:
  - `allow_fallback`
  - mode strictness
  - recoverable failure classification
  - existence of next candidate

## Provider selection lifecycle

1. Build adapter catalog from registry (`id`, `kind`, `available`)
2. Resolve effective policy (`routing-policy.ts`)
3. Select ordered candidates (`provider-selection.ts`)
4. Execute via `ProviderGateway` one adapter at a time
5. If failure is recoverable and fallback allowed, continue to next
6. Return deterministic result with response or normalized error

## Observability produced by routing

Routing populates existing runtime inspection fields (no parallel observability model):

- `runtime_mode`
- `execution_path`
- `provider_chain`
- `fallback_triggered`
- `warnings`
- `latency_ms`
- `tool_execution_count` (always `0` in this phase)

Additionally, orchestration result includes:

- `provider_requested`
- `provider_actual`
- `fallback_reason`

## Examples by mode

- `LOCAL_ONLY` + local up -> local response, no fallback
- `LOCAL_ONLY` + local down -> `NO_PROVIDER_AVAILABLE`
- `HYBRID` local fails recoverably -> cloud fallback succeeds
- `SAFE_FALLBACK` cloud fails recoverably -> local fallback succeeds

## Known limitations

- No dynamic quality scoring or cost-based routing yet
- No parallel racing between providers
- No streaming-specific routing branches in this phase
- No tool/memory-aware routing (out of scope by design)
