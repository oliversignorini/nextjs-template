# Profile build evidence -- status

Last updated: 2026-09-27, FACTORY_SLOT=4.

## Blocked: corrupted Docker image layer (host-wide incident, not this repo)

Timeline on this shared host:

1. `C:` filled completely (465G/465G), wedging Docker's daemon. ~13GB was
   freed and Docker came back healthy.
2. `pnpm env:up` for slot 4 then hit two **real bugs in this repo**, both
   found and fixed (see commit history): `factory.mjs` passed the wrong
   `--workdir` (the `supabase/` folder itself instead of its parent),
   causing project_id to silently fall back to a bogus default and collide
   with an unrelated leftover stack; and `supabase/config.toml` had
   `analytics`/`edge_runtime` ports that weren't in `factory.mjs`'s
   per-slot `BASE_PORTS` map, which would have collided across every slot
   (both are now disabled -- not part of this profile's contract anyway).
3. After both fixes, Postgres still crash-looped with **zero log output**.
   Diagnosed to host RAM at ~0.8GB free (17+ unrelated containers running);
   escalated, paused, RAM later freed to ~12.7GB when another profile's
   Docker phase finished.
4. Retried with healthy RAM/disk -- **still** crash-looping with zero logs.
   Diagnosed further: `/usr/local/bin/docker-entrypoint.sh` inside
   `public.ecr.aws/supabase/postgres:17.6.1.171` is a genuine **0-byte
   file** (verified with `docker cp` to the host), causing `exec format
   error` on every start. Isolated to this one image layer -- `gotrue` and
   `hello-world` images run fine -- almost certainly a layer corrupted by
   the disk-full incident. `docker rmi` + re-pull did not fix it: Docker's
   local content store relinks the same corrupted blob by digest instead
   of refetching it.

Escalated (again). Fixing this needs either a scoped `docker builder
prune`/`system prune` or a Docker Desktop restart, and **both affect other
running projects on this host**, so it's the coordinator's call, not mine.
Per instruction: no prune, no restart, slot 4 stays down, waiting for a
coordinator message before the next `env:up` attempt.

Still paused, pending that fix:

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
- `design-check.txt` -- `pnpm design:check` (impeccable detector over
  `app`, `components`): **pass**, zero findings
- `build.txt` -- `pnpm build` (production build, with placeholder env vars
  for the required-at-build zod schema; not committed): **pass**. Also
  fixed a real bug found this way: Next 16 deprecated the `middleware.ts`
  convention in favour of `proxy.ts` (ran `@next/codemod middleware-to-proxy`).

## Not yet independently verified (written, not yet run)

- `supabase/migrations/*.sql`, `supabase/tests/000_rls.test.sql` (pgTAP) --
  syntax reviewed, not executed against Postgres
- `scripts/factory/factory.mjs`, `scripts/supabase/seed.ts` -- the
  `--workdir` layout bug and the env-var-name assumptions have both been
  corrected and partially exercised (project_id, ports, and the CLI's
  actual `-o env` variable names all confirmed correct); a full `env:up` ->
  `env:reset` -> app boot has not completed yet because of the corrupted
  image layer above
- `e2e/skeleton.spec.ts`, `e2e/api.spec.ts` -- written against the actual
  routes/selectors in the app, not yet executed
- CI workflow (`.github/workflows/ci.yml`) -- not yet exercised (would run
  the same Docker-blocked commands)
