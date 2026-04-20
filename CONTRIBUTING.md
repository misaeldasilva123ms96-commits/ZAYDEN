# Contributing to ZAYDEN

## Engineering bar

- Prefer **adapters and bridges** over invasive merges of upstream intake trees.
- Every meaningful architectural move should include **documentation updates** (`docs/decisions/`, `docs/intake/`, `docs/audits/`).
- Avoid declaring “production-ready” unless tests, docs, and failure paths substantiate the claim.

## Local setup (Phase 1)

1. Unpack vendor trees:

```powershell
.\scripts\unpack-intake.ps1
```

2. Run gates:

```powershell
npm run gate:intake
```

## Reference material policy

Content under `sources/reference/system-prompts-leaks/` is **reference-only**. Do not copy proprietary/system prompt text verbatim into runtime logic.
