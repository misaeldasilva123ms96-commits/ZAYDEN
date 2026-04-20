# Source audit — claw-code (`claw-code-main.zip`)

## Role in ZAYDEN

- **Harness / runtime-quality / parity-testing inspiration**
- Isolated under `sources/intake/claw-code-main/` after unpack

## Observed facts

- **Archive SHA-256:** `614A8515B512797B513CDA0F432451D06DEA000811FD9C8B50B0E6AC70FBEAA3` (pinned in `docs/intake/artifact-hashes.json`)
- Contains Rust workspace material and project documentation describing goals and history (`README.md`).

## Risk register (initial)

- **Narrative/legal sensitivity:** upstream README discusses community events around proprietary software exposure; treat as a communications and compliance topic independent of ZAYDEN engineering quality.
- **Engineering parity claims:** any “parity harness” work must be backed by tests and measurable contracts, not narrative.

## Integration approach (Phase 1)

No runtime coupling. Future phases may import **ideas** (discipline, test harness patterns) into ZAYDEN-owned tests under explicit ADRs.
