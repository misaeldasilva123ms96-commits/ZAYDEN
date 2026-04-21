# Resilience model (runtime)

This document describes how ZAYDEN handles **timeouts**, **retries**, **failure classification**, **chaos simulation**, and **environment profiles** without moving routing decisions into adapters.

## Failure classification

Every provider/runtime failure is mapped to exactly one `FailureClass`:

| Class | recoverable | fallback_allowed | retry_allowed |
| --- | --- | --- | --- |
| `TIMEOUT` | yes | yes | yes |
| `NETWORK_ERROR` | yes | yes | yes |
| `PROVIDER_ERROR` | yes | yes | yes |
| `MALFORMED_RESPONSE` | no | yes | no |
| `NON_RECOVERABLE_ERROR` | no | no | no |

Implementation: `runtime/providers/resilience/failure-classifier.ts`.

Contract validation failures for `provider-response` are treated as `MALFORMED_RESPONSE` when Ajv assertion errors are raised from the gateway (`[zayden:contracts]` … `provider-response`), so routing can still evaluate explicit HYBRID fallback without silent coercion.

## Timeout behavior

`withTimeout` in `runtime/providers/resilience/timeout-controller.ts` wraps a single adapter execution attempt with `Promise.race` against a timer. On expiry it throws `ZaydenTimeoutError`, classified as `TIMEOUT`.

Timeouts are **per attempt** and come from `RoutingPolicy.timeout_policy.per_attempt_ms` (merged with environment profile defaults and caller overrides).

## Retry strategy

Retries are **bounded**, **policy-driven**, and **explicit**:

- `RoutingPolicy.retry_policy` defines `max_attempts`, `retry_delay_ms`, and `retry_on` (failure classes).
- `computeRetryDecision` refuses retries when the failure class is not retryable per the classification table (for example `MALFORMED_RESPONSE` and `NON_RECOVERABLE_ERROR` have `retry_allowed: false` even if misconfigured into `retry_on`).
- The orchestrator logs retry scheduling lines into `execution_path` / `warnings` via `RESILIENCE:*` prefixes.

Retries **do not reorder providers**; they only repeat the same adapter id within the current routing step.

## Chaos injection

`ChaosInjector` applies a deterministic schedule keyed by `adapterId@attemptIndex`. It can inject latency before execution and/or throw `ChaosInducedError` for a specific failure class.

Chaos is **disabled unless** `RoutingRequestInput.simulation.chaos.enabled === true`. Production profiles do not enable chaos by default.

## Environment profiles

`runtime/providers/routing/policy-profiles.ts` supplies patches for:

- `development` — relaxed timeouts, small retry backoff, simulated local fallback allowed.
- `testing` — short timeouts, zero retry delay for fast CI.
- `production` — conservative timeouts, stricter simulation defaults.

Profiles merge as: **orchestrator base policy → profile patch → per-request `input.policy` override** (each step overwrites overlapping keys).

The active profile is `input.environment_profile` when set; otherwise inferred from `ZAYDEN_ENV` / `NODE_ENV`, defaulting to `development`.

## Observability and JSON contracts

`runtime-inspection.schema.json` remains fixed (`additionalProperties: false`). Full resilience metrics are returned on `RoutingResult.resilience` (`ResilienceTelemetry`). The orchestrator also mirrors the same fields into `warnings` / `execution_path` using stable `RESILIENCE:*` strings so chat payloads that embed only `RuntimeInspectionView` still expose resilience signals without schema churn.
