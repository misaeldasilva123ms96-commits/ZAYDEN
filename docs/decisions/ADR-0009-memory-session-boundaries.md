# ADR-0009 — Memory and session boundaries

## Status

Accepted (Phase 8).

## Context

ZAYDEN already enforces contracts for `memory-context`, deterministic routing, tool execution, and resilience. Long-lived assistants risk **implicit** memory growth and **unbounded** context unless memory is a first-class, policy-controlled subsystem.

## Decision

1. **Split session (ephemeral) from persistent memory (optional)** — different stores, different lifecycles, different APIs.
2. **Centralize assembly in `MemoryOrchestrator.buildMemoryContext`** — memory must not self-inject from adapters or providers.
3. **Require explicit allowlists for persistence** — `persistence_namespace` must be set when persistent memory is enabled; missing store is a hard error.
4. **Bound context with deterministic trimming** — oldest-first drops, prefix truncation for a single oversized entry, heuristic token estimate only.
5. **Default `auto_persist` to false** — no implicit writes from the load pipeline; only `persistEntry` performs saves.

## Consequences

- Positive: predictable memory growth, testable behavior, contract-stable envelopes.
- Negative: callers must wire `MemoryOrchestrator` + stores explicitly until a future runtime API phase consolidates service facades.
