# ADR-0007 — Runtime resilience and chaos policy

## Status

Accepted (Phase 6).

## Context

ZAYDEN enforces deterministic routing (ADR-0006) and schema-stable contracts (ADR-0003). Real deployments still need **bounded** retries, **hard** timeouts, and test harnesses that simulate instability without introducing hidden fallbacks or non-deterministic routing.

`runtime-inspection.schema.json` forbids additional properties, so expanding validated inspection objects is not viable without a schema revision.

## Decision

1. **Classify failures** into five explicit classes with fixed `recoverable`, `fallback_allowed`, and `retry_allowed` attributes (`failure-classifier.ts`).
2. Apply **timeouts** and **retries** only inside a dedicated `ResilienceController` that wraps `ProviderGateway.execute` calls initiated by `RuntimeOrchestrator`, preserving adapter isolation and routing ownership.
3. Model chaos as a **pure, schedule-driven injector** that is disabled unless `simulation.chaos.enabled` is true.
4. Represent extended telemetry as `RoutingResult.resilience` and **mirror** key metrics into `warnings` / `execution_path` for observability consumers constrained by inspection schema.
5. Add **environment profiles** as declarative patches merged after the orchestrator base policy and before per-request overrides.

## Consequences

- Positive: explicit, test-covered resilience behavior; reproducible chaos; no silent infinite retries.
- Negative: resilience telemetry is split across `resilience` and string mirrors until a future schema ADR allows first-class inspection fields.
