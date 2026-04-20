# ZAYDEN — Layer model (target architecture)

This document defines the **target** layering for ZAYDEN. It is not a claim that all layers are fully implemented in the repository yet.

## Layer 1 — Source Intake

**Responsibilities**

- Unpack archives into governed locations
- Fingerprint artifacts (SHA-256 for small zips; size + manifest policy for large models)
- Classify each source (operational base vs harness vs study vs reference-only)
- Record audit trails (`docs/intake/*`, `docs/audits/*`)

**Phase 1 implementation**

- `scripts/unpack-intake.ps1`
- `scripts/validate-source-intake.mjs`
- `docs/intake/artifact-hashes.json`
- `sources/models/manifests/*.manifest.json`

## Layer 2 — Runtime Core

**Responsibilities**

- Orchestration, routing, sessions, safety policy application
- Stable internal contracts (types + invariants)

**Phase 5 implementation**

- JSON Schema contracts + TS validators: `runtime/contracts/*.schema.json`, `runtime/contracts/validators.ts`
- Deterministic runtime orchestrator: `runtime/core/runtime-orchestrator.ts`

## Layer 3 — Provider Gateway

**Responsibilities**

- Normalize request/response across providers
- Local model routing (GGUF via supported local runtimes)
- Cloud provider routing
- Explicit fallback reasons (observable)

**Phase 5 implementation**

- `ProviderRegistry` + `ProviderGateway` (`runtime/providers/registry/provider-registry.ts`)
- Adapters: `runtime/providers/adapters/mock/mock.adapter.ts`, `runtime/providers/adapters/local/gemma-local.adapter.ts`, `runtime/providers/adapters/local/gemma-http.adapter.ts`, `runtime/providers/adapters/local/gemma-cli.adapter.ts`
- Routing policy layer: `runtime/providers/routing/*`

## Layer 4 — Tooling & Execution

**Responsibilities**

- Tool registry, execution policy, permissions, deterministic tool-call tests

**Phase 1 implementation**

- Scaffold README only: `runtime/tools/README.md`

## Layer 5 — Memory & State

**Responsibilities**

- Session state, optional persistence, storage abstraction

**Phase 1 implementation**

- Scaffold README only: `runtime/memory/README.md`

## Layer 6 — Observability

**Responsibilities**

- Structured logs, traces, provider_actual, runtime_mode, fallback_reason, latency, usage estimates

**Phase 1 implementation**

- Schema stub: `runtime/observability/event-schema.json`

## Layer 7 — Test Harness

**Responsibilities**

- Unit, integration, contract, regression, fallback tests

**Phase 1 implementation**

- Node built-in tests under `tests/`
- Gate script: `npm run gate:intake`

## Layer 8 — Documentation

**Responsibilities**

- Architecture docs, audits, ADRs, testing docs, phase reports, changelog

**Phase 1 implementation**

- This document tree under `docs/`
