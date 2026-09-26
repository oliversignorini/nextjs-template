# Profile build evidence -- status

Last updated: 2026-09-26, FACTORY_SLOT=4.

## Blocked: Docker-dependent checks

The host's `C:` drive filled completely (465G/465G used, 0 available)
earlier in this build, which wedged Docker Desktop's daemon (`docker
builder prune` timed out pinging it). ~13GB has since been freed
(98% used) and non-Docker work has resumed, but **Docker itself is still
down** and the coordinator has asked to keep Docker/DB work paused until
told otherwise. This is a machine-wide condition -- ~17 containers from
unrelated projects (`lotwise-prod/dev`, `index-insurance`) also run on this
host -- not something scoped to this worktree, so no Docker cleanup was run
here.

Still paused, pending Docker being confirmed up:

- `pnpm env:up` / `env:reset` (supabase start / db reset)
- `pnpm test:db` (pgTAP)
- `pnpm e2e` / `pnpm e2e:baseline` (Playwright)
- Isolation proof (slots 4 + 5 concurrently)

## Verified so far (no Docker required)

- `lint.txt` -- `pnpm lint` (ESLint incl. `@shadcn/lint`, blocking + Prettier
  check): **pass**
- `typecheck.txt` -- `pnpm typecheck` (`tsc --noEmit`): **pass**
- `test-unit.txt` -- `pnpm test:unit` (Vitest, DB-free/mocked Supabase
  client): **pass**, 9/9
- `api-check.txt` -- `pnpm api:check` (OpenAPI regenerate + drift check
  against committed `openapi.json`): **pass**
- `build.txt` -- `pnpm build` (production build, with placeholder env vars
  for the required-at-build zod schema; not committed): **pass**. Also
  fixed a real bug found this way: Next 16 deprecated the `middleware.ts`
  convention in favour of `proxy.ts` (ran `@next/codemod middleware-to-proxy`).

## Not yet independently verified (written, not yet run)

- `supabase/migrations/*.sql`, `supabase/tests/000_rls.test.sql` (pgTAP) --
  syntax reviewed, not executed against Postgres
- `scripts/factory/factory.mjs`, `scripts/supabase/seed.ts` -- reviewed;
  the CLI's default `supabase status -o env` variable names
  (`API_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY`) were confirmed by grepping the
  installed `supabase.exe` binary, so `envVars()`'s parsing should be
  correct, but this hasn't been exercised against a live stack yet
- `e2e/skeleton.spec.ts`, `e2e/api.spec.ts` -- written against the actual
  routes/selectors in the app, not yet executed
- `pnpm design:check` (impeccable) -- not yet run
- CI workflow (`.github/workflows/ci.yml`) -- not yet exercised (would run
  the same Docker-blocked commands)
