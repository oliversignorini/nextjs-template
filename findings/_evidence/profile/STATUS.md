# Profile build evidence -- status

Last updated: 2026-09-27, FACTORY_SLOT=4, round 4 (re-review fixes).

## Round 4

Fixed the round-4 re-review's one major finding, N-5 (the residual of
round 3's N-4): the CAS reclaim guaranteed exactly one claim *owner*, but
not exactly one note *creator* -- a slow-but-alive original could still
create a duplicate note after its claim was reclaimed by a retry, because
its finalize update's zero-row result (PostgREST reports that as success)
went undetected. Fixed in the service layer: the finalize now checks
`.select('claim_token').maybeSingle()`, and on 0 rows deletes the orphan
note it just created and returns `409 IDEMPOTENCY_CONFLICT`. Also closed
m-11 (mixed clocks -- staleness now computed against the DB's own clock
via a `db_now()` RPC) and raised the stale window to `IDEMPOTENCY_STALE_AFTER_S`
(default 600s, above Vercel's 300s max request duration). m-9 (key TTL)
remains a documented follow-up. `pnpm test:unit` grew from 31 to 32;
pgTAP grew from 21 to 26 (a full N-5 timeline: stall, reclaim, clean
retry finalize, lost-ownership finalize, compensating delete, exactly
one surviving note). Full detail in the PR description and
`docs/profiles-build/reviews/next-supabase-r3.md`.

## Round 3 (not separately logged here -- see PR description)

Fixed N-3 (reopened, dot-segment open redirect) and N-4 (idempotency
double-create race via an atomic CAS reclaim), plus m-8/m-10. See the PR
description's "Round 3" section and `docs/profiles-build/reviews/next-supabase-r2.md`.

## Round 2

Fixed the round-2 re-review's one blocking finding (N-0: CI was red on
Linux only -- `api:check` drifted because the OpenAPI spec generator walked
`app/api/v1` with an unsorted `readdirSync`, so path/component order in
`openapi.json` depended on the filesystem's directory-entry order, which
NTFS happens to return alphabetically and ext4 does not) and all 3 new
majors (N-1 cursor injection, N-2 idempotency key stuck after a failed
create, N-3 backslash open redirect), plus several of the minors. See the
PR description for the full list and `docs/profiles-build/reviews/next-supabase-r1.md`
for the source review. `pnpm test:unit` grew from 11 to 27 (new tests for
hostile cursors, the redirect helper's backslash/control-character cases,
and the idempotency release-on-failure path); pgTAP grew from 18 to 19 (an
unrecognized `app_metadata.role` value regression test, m-5).

## Round 1

Fixed every blocking (B-1 privilege escalation, B-2 OpenAPI spec, B-3
pagination cursor) and major finding from
`docs/profiles-build/reviews/next-supabase.md`, plus the minors affecting
test validity or security. Full list in the PR description. Re-verified on
slot 4 after the fixes:

- `pnpm lint` / `pnpm typecheck` / `pnpm api:check`: pass
- `pnpm test:unit`: pass, **11/11**
- `pnpm test:db` (pgTAP): pass, **18/18** (was 9 -- added generic RLS
  coverage, per-role tests for `profiles`/`idempotency_keys`/`anon`, and
  the B-1 regression tests)
- `pnpm e2e:baseline`: pass, **10/10** (was 5 -- added `/api/v1/me`,
  idempotency-conflict, self-signup-escalation, magic-link, and
  pagination-to-the-end cases)
- Found a real bug while verifying B-1's fix: the Admin API sets
  `app_metadata` via a follow-up `UPDATE`, not the initial `INSERT`, so
  the insert-only trigger missed the seeded admin's role. Added a second
  trigger; see the PR description. **All contract commands verified passing.**

## Summary (kept in sync with the latest round -- see the round sections above/below for what changed and why)

| Command                       | Result                                   | Evidence              |
| ----------------------------- | ---------------------------------------- | --------------------- |
| `pnpm lint`                   | pass                                     | `lint.txt`            |
| `pnpm typecheck`              | pass                                     | `typecheck.txt`       |
| `pnpm test:unit`              | pass, 32/32                              | `test-unit.txt`       |
| `pnpm build`                  | pass (round 0)                           | `build.txt`           |
| `pnpm design:check`           | pass, 0 findings (round 0)               | `design-check.txt`    |
| `pnpm api:check`              | pass, no drift (Windows and Linux)       | `api-check.txt`       |
| `pnpm env:up` / `env:reset`   | pass                                     | `env-reset.txt`       |
| `pnpm health`                 | pass (`{"slot":4,"web":true,"ok":true}`) | --                    |
| `pnpm test:db` (pgTAP)        | pass, 26/26                              | `test-db.txt`         |
| `pnpm e2e:baseline`           | pass, 10/10                              | `e2e-baseline.txt`    |
| Isolation proof (slots 4 + 5) | pass (round 0)                           | `isolation-proof.txt` |
| CI (GitHub Actions)           | see PR description, round 4              | CI run URL in PR body |

## Environment incidents worked through (all fixed, not worked around)

This build hit a genuinely difficult sequence of shared-host resource
issues on top of real bugs in the new code. In order:

1. **Host disk filled completely** (465G/465G) mid-build, wedging Docker's
   daemon. Escalated; did not run any cleanup (system-wide, other projects'
   data). Resolved by the coordinator freeing space elsewhere.
2. **`factory.mjs` `--workdir` bug**: passed the `supabase/` directory
   itself instead of its parent (the CLI wants the latter, used exactly as
   given, no ancestor search). Silently fell back to a bogus default
   project_id and collided with an unrelated stack on the host. Fixed.
3. **Host RAM exhaustion** (~0.8GB free of ~32GB, other projects' Docker
   stacks). Postgres OOM-crash-looped with zero log output. Escalated,
   paused, resolved when RAM freed up.
4. **Corrupted Docker image layer**: `supabase/postgres:17.6.1.171`'s
   `docker-entrypoint.sh`/`gosu` were 0-byte files on this host (confirmed
   via `docker cp`), independent of RAM/disk, not fixed by `docker rmi` +
   re-pull. Escalated (fix required a prune/restart affecting other
   projects); the coordinator resolved it another way and had `.172`
   verified intact. Pinned `factory.mjs` to `17.6.1.172` via
   `supabase/.temp/postgres-version` so this repo never depends on the
   CLI's own default resolution again.
5. **Unmapped ports in `config.toml`**: `analytics.port` (54327) and
   `edge_runtime.inspector_port` weren't in `factory.mjs`'s per-slot
   `BASE_PORTS`, which would have collided across every slot. Neither
   service is part of this profile's contract (Postgres/Auth/Mailpit only)
   and both cost real RAM; disabled, along with unused `storage`/`realtime`.
   One Supabase slot's Docker footprint is now **~650MB** (`docker stats`),
   well under the profile spec's estimated 1-2GB risk.
6. **`gen:types` missing a required flag** (`--local`/`--linked`/
   `--project-id`/`--db-url`). Fixed; committed the real generated
   `types/database.ts` (was a placeholder).
7. **pgTAP: `row_security_is_enabled` isn't a real pgTAP function.** Fixed
   to assert `pg_class.relrowsecurity` directly.
8. **`supabase start` intermittent Windows flake**: `EUNKNOWN: unknown
error, uv_spawn` on a cold start (nested spawn through pnpm -> node ->
   the CLI binary -> docker), even though the compose stack itself is fine
   and an unmodified retry succeeds. Added `startWithRetry()` (3 attempts)
   in `factory.mjs`.
9. **Next 16 deprecation**: `middleware.ts` -> `proxy.ts` (ran the official
   codemod). Found via `pnpm build`, which needs env vars present at build
   time -- expected/correct behavior (matches a real Vercel build), not a
   bug.
10. Dead dependencies removed (`react-hook-form`, `@hookform/resolvers`,
    `@tanstack/react-query`, individual `@radix-ui/react-*` packages
    superseded by the unified `radix-ui` package shadcn now generates) and
    the unused shadcn `Form` primitive deleted.

None of the above were worked around or silently ignored; each has a
proper fix committed, and #1-4 were escalated rather than guessed at
because they were machine-wide and affected other people's running
projects.
