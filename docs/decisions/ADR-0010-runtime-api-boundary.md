# ADR-0010 — Runtime API boundary

## Status

Accepted — Phase 9

## Context

ZAYDEN already had strict **internal** JSON contracts (`runtime/contracts`) and deterministic orchestration. External clients, however, need a **stable, narrow HTTP surface** that does not leak adapter-specific payloads or internal debugging details.

## Decision

1. **Keep transport thin**  
   HTTP code owns parsing, routing to handlers, status codes, and serialization only. Any rule that belongs to provider selection, resilience, memory, or tools stays in existing runtime modules.

2. **Maintain a distinct public schema**  
   Public request/response schemas live under `runtime/api/schemas` with their own `$id` namespace. They are validated with Ajv before any orchestration call. Internal `ProviderRequest` / `RoutingResult` shapes are produced or consumed only inside `RuntimeService` and below.

3. **`RuntimeService` is the sole orchestration entrypoint for HTTP**  
   The API layer calls `RuntimeService.executeChat` / `describeReadiness` instead of reaching `RuntimeOrchestrator` or registries directly from handlers. This preserves a single choke-point for mapping, telemetry assembly, and error translation.

4. **Errors are normalized twice**  
   Internal routing errors are converted to `PublicErrorBody` without stack traces. Unknown exceptions become `INTERNAL_ERROR` with sanitized messages. HTTP status codes follow a small documented table (`api-errors.ts`).

## Consequences

### Positive

- Clear upgrade path for external integrations without freezing internal contracts.
- Reduced risk of accidental coupling between client payloads and adapter implementations.
- Easier compliance with “no business logic in transport” reviews.

### Negative

- Some field duplication between public and internal models (explicit mapping cost).
- Two schema families must be versioned and tested (`runtime/contracts` vs `runtime/api/schemas`).

## Alternatives considered

- **Expose internal contracts directly on HTTP** — rejected: too leaky, couples clients to adapter evolution.
- **Implement orchestration inside Express-style controllers** — rejected: violates deterministic layering and prior phase boundaries.

## References

- `docs/architecture/runtime-api-surface.md`
- `runtime/core/runtime-service.ts`
- `runtime/api/normalization/*`
