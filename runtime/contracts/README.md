# Runtime contracts (ZAYDEN-owned)

JSON Schema is the **source of truth** for cross-boundary payloads. TypeScript exports validation helpers only — no provider logic.

## Contents (Phase 2)

- `*.schema.json` — versioned contracts (`contract_version` is `1.0.0` today)
- `schema-ids.ts` — canonical `$id` strings (avoid circular imports)
- `validators.ts` — strict Ajv compilation + `createContractValidators()`
- `index.ts` — public exports for ZAYDEN packages

## Documentation

See `docs/architecture/runtime-contracts.md`.

## Tests

Contract tests live in `tests/contracts/` and run via `npm run test:contracts`.
