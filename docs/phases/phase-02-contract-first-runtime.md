# Phase 2 — Contract-first runtime design (complete)

## Objective

Define internal JSON contracts **before** any provider routing, tool execution, or upstream integration.

## Deliverables

- JSON Schemas under `runtime/contracts/*.schema.json`
- Strict Ajv validators in `runtime/contracts/validators.ts`
- Public TS exports in `runtime/contracts/index.ts` + `runtime/contracts/schema-ids.ts`
- Documentation: `docs/architecture/runtime-contracts.md`
- Tests: `tests/contracts/*.test.ts`

## Gate

**PASS** if `npm run typecheck` and `npm run test:contracts` succeed.

No provider implementations are included in this phase.
