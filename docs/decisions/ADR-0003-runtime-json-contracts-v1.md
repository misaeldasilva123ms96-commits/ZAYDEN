# ADR-0003 — Runtime JSON contracts v1.0.0

- Status: Accepted
- Date: 2026-04-20

## Context

ZAYDEN needs provider-agnostic, serializable contracts that can evolve without rewriting orchestration every time a new model backend appears.

## Decision

1. **JSON Schema (draft 2020-12)** is the canonical contract representation for cross-boundary payloads.
2. **Ajv** validates inbound/outbound objects at runtime boundaries (tests demonstrate strictness).
3. **Versioning** is carried by explicit `contract_version` fields (currently `1.0.0`).
4. **No imports** from `research/` or upstream codebases in contract modules.

## Consequences

- Future providers must map into `provider-request` / `provider-response` envelopes rather than leaking SDK shapes into core types.
- Breaking changes require coordinated version bumps + migration notes.
