# F0-F10 publish report

## Repository

- name: `zayden-runtime` (recommended target)
- url: pending remote creation (`gh` CLI unavailable on this machine)

## Branch pushed

- `F0-F10`

## Commit

- hash: `3c7ad6e`

## Validation commands run

- `npm run typecheck`
- `npm run test`
- `npm run gate:f0-f10`

## Publication result

- status: local branch prepared; remote publication blocked by missing GitHub CLI (`gh`)
- notes:
  - no remote configured (`git remote -v` empty)
  - `gh` command unavailable in shell
  - exact publication commands:

```bash
# create a new repository on GitHub (web UI) named zayden-runtime
git remote add origin https://github.com/<your-org-or-user>/zayden-runtime.git
git push -u origin F0-F10
```

## Pending before main

- confirm branch review/approval on remote
- merge strategy decision into `main` (deferred)
