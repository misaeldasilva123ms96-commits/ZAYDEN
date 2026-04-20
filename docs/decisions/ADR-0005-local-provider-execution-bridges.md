# ADR-0005 — Local provider execution bridges

- Status: Accepted
- Date: 2026-04-20

## Context

Phase 3 established registry/gateway contracts. Execution remained mostly stubbed.

## Decision

1. Keep `ProviderGateway` structure unchanged.
2. Implement real bridge logic only in adapters (`gemma-http`, `gemma-cli`).
3. Normalize adapter failures through `ProviderExecutionError` carrying an error-envelope-compatible payload.
4. Keep all external I/O dependencies inside `runtime/providers/adapters/shared/*`.

## Consequences

- Runtime core and contracts remain isolated from vendor runtime wire formats.
- Real local runtime can be used when available; simulation remains deterministic fallback.
