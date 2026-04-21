# Chaos testing runbook

## How to enable chaos

Chaos is **opt-in** per request via `RoutingRequestInput.simulation.chaos`:

```ts
simulation: {
  chaos: {
    enabled: true,
    schedule: {
      "local-a@0": { latency_ms: 25 },
      "local-a@1": { force_failure: "NETWORK_ERROR" },
    },
  },
}
```

Keys use the form `adapterId@attemptIndex` where `attemptIndex` is the **resilience** attempt counter (0-based) for that adapter.

## How to reproduce failures

1. Pick the adapter id from your registry (for example `gemma-local` or a test double).
2. Set `force_failure` to a `FailureClass` value that matches the scenario you need (`TIMEOUT` is modeled via `ZaydenTimeoutError` from real timeouts; chaos can also synthesize `NETWORK_ERROR` and others through `ChaosInducedError`).
3. Combine with `RoutingPolicy.timeout_policy.per_attempt_ms` to force real wall-clock timeouts without chaos (slow adapter + tight timeout).

Automated examples live under `tests/resilience/chaos-routing.test.ts`.

## How to debug failures

- Read `RoutingResult.observability.execution_path` — resilience emits `RESILIENCE:*` lines for attempts, retries, and chaos.
- Read `RoutingResult.observability.warnings` — duplicates key telemetry for consumers that only store inspection payloads.
- Read `RoutingResult.resilience` — structured counters (`retry_count`, `timeout_triggered`, `failure_type`, `chaos_applied`, `execution_attempts`).

## Known limitations

- Chaos currently runs **before** each adapter invocation (`preExecute`). Latency inside adapter code requires a slow test double or a deliberately low `per_attempt_ms`.
- Chaos schedules are **explicit maps** — there is no randomness in the injector itself; flakiness should only come from real timers when tests use non-zero delays.
- Provider-level contract validation errors are surfaced as `MALFORMED_RESPONSE` based on gateway error text conventions; adapters should still aim to return schema-valid payloads.
