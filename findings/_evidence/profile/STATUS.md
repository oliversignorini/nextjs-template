# Profile build evidence -- status

Last updated: 2026-09-26, FACTORY_SLOT=4.

## Blocked: Docker/Supabase-dependent checks

The host's `C:` drive is completely full (465G/465G used, 0 available) and
Docker Desktop's daemon is unresponsive as a result (`docker builder prune`
times out pinging the daemon). This is a machine-wide condition -- ~17
containers from unrelated projects (`lotwise-prod/dev`, `index-insurance`)
are also running on this host -- not something scoped to this worktree.

Escalated to the coordinator; instructed to **not** run any Docker cleanup
(system-wide, affects other projects) and to pause all Docker/DB/build work
until disk space is freed elsewhere. Paused:

- `pnpm env:up` / `env:reset` (supabase start / db reset) -- not yet run
  against a live stack this session
- `pnpm test:db` (pgTAP) -- not yet run
- `pnpm build` -- failed with `ENOSPC: no space left on device`
- `pnpm e2e` / `pnpm e2e:baseline` -- not yet run
- Isolation proof (slots 4 + 5 concurrently) -- not yet run

These will resume once the coordinator confirms disk space is available.

## Verified so far (no Docker required)

- `lint.txt` -- `pnpm lint` (ESLint incl. `@shadcn/lint`, blocking + Prettier
  check): **pass**
- `typecheck.txt` -- `pnpm typecheck` (`tsc --noEmit`): **pass**
- `test-unit.txt` -- `pnpm test:unit` (Vitest, DB-free/mocked Supabase
  client): **pass**, 3/3
- `api-check.txt` -- `pnpm api:check` (OpenAPI regenerate + drift check
  against committed `openapi.json`): **pass**

## Not yet independently verified (written, not yet run)

- `supabase/migrations/*.sql`, `supabase/tests/000_rls.test.sql` (pgTAP) --
  syntax reviewed, not executed against Postgres
- `scripts/factory/factory.mjs`, `scripts/supabase/seed.ts` -- reviewed,
  `env:up` for slot 4 was started but killed mid-run (stuck on a Docker
  pull) once the disk-space issue surfaced
- `e2e/skeleton.spec.ts`, `e2e/api.spec.ts` -- written against the actual
  routes/selectors in the app, not yet executed
- `pnpm design:check` (impeccable) -- not yet run
- CI workflow (`.github/workflows/ci.yml`) -- not yet exercised (would run
  the same blocked commands)
