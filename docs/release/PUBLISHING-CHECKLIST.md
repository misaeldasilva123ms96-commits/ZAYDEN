# Publishing checklist (F0-F10)

## Pre-publish validation

- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run gate:f0-f10`
- [ ] working tree clean (`git status --short`)

## Repository hygiene

- [ ] `.gitignore` excludes local archives/models/secrets/temp outputs
- [ ] no accidental binary/runtime artifacts staged
- [ ] no local `.env` or secrets staged
- [ ] docs and tests align with implemented behavior

## Branch strategy

- [ ] create/use branch `F0-F10`
- [ ] push `F0-F10` to new repository first
- [ ] do not merge into `main` yet

## Publication records

- [ ] `docs/release/f0-f10-audit-report.md` updated
- [ ] `docs/release/F0-F10-BASELINE.md` updated
- [ ] `docs/release/F0-F10-PUBLISH-REPORT.md` updated with repo/branch/commit
