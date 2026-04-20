# Source audit — OpenClaude (`openclaude-main.zip`)

## Role in ZAYDEN

- **Primary operational base candidate** (per program charter)
- **Not** merged into a ZAYDEN-owned runtime implementation in Phase 1

## Observed facts (from intake fingerprinting)

- **Archive SHA-256:** `804B3541026431D89F21BAFB82108B66CB584EA49F89C40923EFF30922D3E6FA` (pinned in `docs/intake/artifact-hashes.json`)
- **Declared package identity (upstream):** `@gitlawb/openclaude` version `0.1.7` (`sources/intake/openclaude-main/package.json` after unpack)

## Dependency and build model (high level)

- Node ecosystem with `"type": "module"`
- Upstream scripts commonly assume **Bun** for builds (`bun run ...` in `package.json` scripts)

## Risk register (initial)

- **Proprietary upstream lineage:** upstream `LICENSE` includes Anthropic proprietary notice; treat redistribution/commercial use as a legal review item.
- **Runtime drift:** upstream evolves independently; ZAYDEN must pin versions and record upgrades via ADRs.

## Integration approach (explicit non-decision for Phase 1)

No invasive rewrite. Future phases should prefer **adapters/wrappers** at the provider boundary rather than forking upstream internals without a measured advantage.
