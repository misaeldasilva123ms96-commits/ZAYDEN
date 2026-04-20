# ADR-0004 — Provider gateway boundary

- Status: Accepted
- Date: 2026-04-20

## Context

ZAYDEN Phase 2 fixed JSON contracts for provider hops. We need an execution boundary that:

- validates requests/responses with Ajv
- supports multiple adapters
- remains free of vendor SDK types

## Decision

1. Introduce `ProviderGateway` + `ProviderRegistry` under `runtime/providers/registry/`.
2. All adapters implement `ProviderAdapter` from `runtime/providers/base/provider.interface.ts`.
3. Ingress/egress validation is **mandatory** (`assertValidProviderRequest` / `assertValidProviderResponse`).
4. OpenClaude (and other upstreams) may only integrate later via **new adapter modules** + explicit subprocess/HTTP boundaries (not in this ADR).

## Consequences

- Adapters may maintain private helper files (e.g. health checks) but must emit only `ProviderResponse` contract objects.
