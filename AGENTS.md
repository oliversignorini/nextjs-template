# AGENTS.md

Next.js 16 + Supabase (Postgres, Auth, Mailpit) SaaS starter. This file is
the short version an agent needs before writing a line here; `CLAUDE.md`
points here.

## API-first (non-negotiable)

Every capability lives in a service function under `lib/<domain>/service.ts`.
Route handlers (`app/api/v1/**`) and the UI's Server Components/Server
Actions both call the **same** service functions with a Supabase client
already scoped to the acting user -- never a different code path, so the
versioned HTTP API always has parity with the UI.

- No business logic in Postgres RPC/functions. Supabase is storage + auth;
  RLS is defence in depth, not the only check.
- No client-side `supabase.from()`/`.rpc()` calls from the browser. Every
  read/write goes through a service function, called either from a Server
  Component/Action (cookie session) or from `app/api/v1/**` (cookie session
  or `Authorization: Bearer <access_token>` -- an agent can call the API
  with no browser).
- `openapi.json` is generated from the zod schemas in each domain's
  `schemas.ts` (`pnpm api:generate`). `pnpm api:check` fails on drift; it
  runs in CI. Regenerate and commit, don't hand-edit `openapi.json`.
- Error shape is always `{ "error": { "code", "message", "field?" } }`
  (`lib/api/errors.ts`, `mapDbError()` for Postgres/PostgREST errors --
  never forward a raw DB message to a caller). List endpoints use cursor
  pagination (`lib/api/pagination.ts` -- the cursor is an opaque
  base64url token, treat it as such, never parse it). Creates accept an
  `Idempotency-Key` header, scoped per user with a request-body hash: a
  reused key with the same body returns the original result, a reused key
  with a different body is `409`.
- **Idempotency claim ownership** (`lib/notes/service.ts`): a claim (in
  flight, `response is null`) older than `IDEMPOTENCY_STALE_AFTER_S`
  (env var, default `600`, validated at module load as an integer >= 360 --
  an invalid value fails fast with a clear error instead of silently
  producing `NaN`-driven 500s or a window so small it reopens the race
  below) is reclaimable by a retry -- this must stay above your deploy
  target's actual max request duration (Vercel's default is 300s), or a
  live-but-slow request can be reclaimed out from under itself. Staleness
  is computed against the DB's own clock (an RPC, `db_now()`) never the
  app's `Date.now()`, so instance/DB clock skew can't shrink the window. If
  a request's own finalize update later matches zero rows, or the finalize
  update itself fails, it deletes the note it just created (checking the
  delete's own result -- a failed or 0-row compensating delete is logged
  and surfaced as `500`, never returned as if it had succeeded) and returns
  `409 IDEMPOTENCY_CONFLICT` instead of ever returning an orphaned note.
  There is deliberately no RPC transaction wrapping claim+insert+finalize
  (an architecture-rule call: that would put the create path's control
  flow in a DB function, which is business logic, not infra); the tradeoff
  is a request that crashes between the note insert and the finalize check
  can leave one uncompensated orphan note, an
  accepted residual risk for a profile skeleton. `idempotency_keys` has no
  TTL/cleanup yet (a documented follow-up, not a correctness bug).

### Adding a new API resource

1. `lib/<domain>/schemas.ts` -- zod shapes, `registry.register(...)` each one.
2. `lib/<domain>/service.ts` -- the actual logic, typed `SupabaseClient<Database>`.
3. `app/api/v1/<resource>/openapi.ts` -- `registry.registerPath(...)` for
   every method this resource exposes. **Required**, not optional:
   `pnpm api:check` greps every `route.ts` for its exported HTTP methods and
   fails the build if one isn't registered here.
4. `app/api/v1/<resource>/route.ts` -- thin handler, `import './openapi'` at
   the top, calls the service function.
5. `pnpm api:generate` to write `openapi.json`, commit it.
6. A Server Component/Action calling the same service function (API-first
   parity), a pgTAP test for the table's RLS, and an `e2e:baseline` case.

## Per-domain file shape

```
lib/<domain>/
├── schemas.ts   # zod request/response shapes, registered into the OpenAPI registry
├── service.ts   # all business logic; takes a scoped Supabase client, never creates one
└── service.test.ts  # DB-free unit tests (fake/mock the client)
```

`lib/notes/` is the reference slice (the walking-skeleton demo resource) --
copy its shape, not its content.

## Data & access control

- Every table has RLS enabled, no exceptions -- `supabase/tests/000_rls.test.sql`
  asserts this **generically** (queries `pg_tables`/`pg_policies` directly,
  so a new table with no RLS or no policy fails automatically) and exercises
  per-role access for `profiles`, `notes`, `idempotency_keys` and `anon`.
- **Role source of truth: `auth.users.raw_app_meta_data`, never
  `raw_user_meta_data`.** `user_metadata` (the `data` field of a public
  `signUp()`/`signInWithOtp()` call) is client-controlled with only the anon
  key -- trusting it for role/permission decisions is a privilege-escalation
  hole (this profile's B-1 finding, round 1). `app_metadata` can only be set
  by the service role (the Admin API), which is what `scripts/supabase/seed.ts`
  uses. `handle_new_user()` in `supabase/migrations/20260926100000_profiles.sql`
  reads `raw_app_meta_data ->> 'role'`; keep it that way, and keep the pgTAP
  regression test (a user with `user_metadata.role=admin` must get `member`).
- `profiles` has no update/insert/delete policy: there is no user-editable
  profile field in this skeleton (email mirrors `auth.users`, role is
  admin-only), so there is no legitimate self-service write to allow. A
  future app that adds one (e.g. a display name) should add a
  narrowly-scoped policy for that column, not reopen this one.
- `supabase/migrations/` holds every schema change, timestamped filenames
  (`supabase db reset` order depends on it). `supabase/seed.sql` is
  schema-level seed data only; demo _users_ are created via the Admin API
  by `scripts/supabase/seed.ts` (`pnpm env:reset` runs it) because
  `auth.users` rows need GoTrue, not raw SQL.
- Regenerate `types/database.ts` after every migration: `pnpm gen:types`
  (also runs automatically as the last step of `env:reset`).
- Migration-safety review: whenever `supabase/migrations/` changes, treat it
  like a production schema change -- no destructive change without a plan
  for existing data. Supabase migrations are forward-only here (no `down`
  file), so get the `up` right the first time.
- `supabase/config.toml` only enables Postgres, Auth and Mailpit (`api`,
  `db`, `auth`, `local_smtp`, `studio`) -- this profile's contract.
  `storage`, `realtime`, `analytics` and `edge_runtime` are disabled: they
  aren't used by the demo resource, cost real RAM on a shared factory host,
  and (analytics/edge_runtime) have ports `scripts/factory/factory.mjs`
  doesn't remap per slot. Re-enable per-app if a feature needs one, and add
  its port(s) to `BASE_PORTS` in `factory.mjs` first if you do.
- **Postgres image pin:** `factory.mjs` writes `postgres-version` (currently
  `17.6.1.172`) into every slot's satellite `.temp/` dir, which is what the
  Supabase CLI reads to pick the Postgres patch version -- it does not rely
  on the CLI's own default resolution for `major_version = 17`. This exists
  because `17.6.1.171`'s image had a corrupted local unpack on the factory
  host (`docker-entrypoint.sh`/`gosu` were 0 bytes, reproducible
  independently of this repo, not fixed by `docker rmi` + re-pull -- Docker
  relinked the same corrupted blob by digest). Bump `PINNED_POSTGRES_VERSION`
  in `factory.mjs` if a newer patch is verified good, or drop the pin
  entirely once the CLI's own default is confirmed >= a known-good version.
- **`env:up` flakiness on Windows:** `supabase start` spawns ~13 containers
  through several nested process spawns (pnpm -> node -> the CLI binary ->
  docker) and intermittently fails a cold start with `EUNKNOWN: unknown
error, uv_spawn`, even though the compose stack itself is fine and a
  second attempt succeeds unchanged. `factory.mjs`'s `startWithRetry()`
  retries up to 3 times before treating it as a real failure -- this is why
  `env:up`/`env:reset` can take a couple of attempts' worth of time on a
  cold slot.

## Software-factory profile (`next-supabase-vercel`)

This repo is the seed for the `next-supabase-vercel` profile of the software
factory. Agents working in a factory worktree use these commands, never the
raw ones, because every command is scoped to the worktree's `FACTORY_SLOT`.

| Command                    | What it does                                                                  |
| -------------------------- | ----------------------------------------------------------------------------- |
| `pnpm bootstrap`           | Install deps, bring up this slot's Supabase stack, migrate + seed             |
| `pnpm env:up` / `env:down` | Start / stop this slot's local Supabase stack (`.factory/supabase-s<slot>/`)  |
| `pnpm env:reset`           | Fresh DB: stop, start, `supabase db reset`, seed demo users + rows, gen types |
| `pnpm dev:slot`            | `next dev` on this slot's port                                                |
| `pnpm health`              | Exit 0 when `GET /api/health` on this slot returns 200 with `{db:true}`       |
| `pnpm lint`                | ESLint (incl. `@shadcn/lint`) + Prettier check                                |
| `pnpm typecheck`           | `tsc --noEmit`                                                                |
| `pnpm test:unit`           | Vitest, DB-free (mocked Supabase clients)                                     |
| `pnpm test:db`             | `supabase test db` -- pgTAP: RLS-enabled + per-role access on every table     |
| `pnpm e2e`                 | Playwright against this slot (starts `dev:slot` if it isn't running)          |
| `pnpm e2e:baseline`        | The e2e specs CI runs: skeleton, API-only, magic-link, pagination             |
| `pnpm design:check`        | impeccable design detector over `app` and `components`                        |
| `pnpm api:check`           | Regenerate `openapi.json` and fail on drift                                   |

**Slots.** `FACTORY_SLOT` (0-9) is set by the factory chair per worktree.
Every port is its default + `slot*100` (`node scripts/factory/factory.mjs
ports`). Supabase's `project_id` becomes `nextjs-template-s<slot>` and the
whole stack lives in a per-slot satellite dir (`.factory/supabase-s<slot>/`,
gitignored) so two slots never share a container, volume or port. The
generated `.env.local` carries a `managed-by` header; never hand-edit it --
move it aside and re-run `pnpm env:up` if you need to.

**Factory workflow.** isolate (`FACTORY_SLOT` + `pnpm env:up`) -> build the
slice -> checks (`lint` -> `typecheck` -> `test:unit` -> `api:check` ->
`test:db` -> `e2e:baseline`, in that order -- the first failure stops the
run) -> proof (evidence in `findings/_evidence/`) -> PR. Never work on `main`
directly; never skip a hook.

**Auth redirects.** `site_url`/`additional_redirect_urls` in
`supabase/config.toml` are rendered per-slot to match
`NEXT_PUBLIC_APP_URL`'s host exactly (`localhost`, not `127.0.0.1` --
browsers treat them as different origins, which silently breaks the magic
link's PKCE exchange). `lib/safe-redirect.ts`'s `safeNext()` is the only
way a `next`/`redirect` query or form value may reach a `Response.redirect`
or `redirect()` call: it accepts only same-origin relative paths (`/foo`,
never `//foo` or an absolute URL) and is what stands between `/auth/callback`
and an open redirect. Reuse it; don't hand-roll another `${origin}${next}`.

**Demo data.** `pnpm env:reset` seeds three users, password
`demo-password-123`: `admin@demo.test` (role `admin`), `member@demo.test`
(role `member`, owns the seeded demo note), `member2@demo.test` (role
`member`, used by the RLS negative tests). Idempotent.

**Design system.** App code composes `components/ui` and the tokens in
`app/globals.css` (ocean palette, copied from `ui-oliversignorini`).
`@shadcn/lint` blocks restyling components through `className`, raw palette
colours, arbitrary values, inline styles and unknown classes. If a design
needs something no variant provides, add the variant in `components/ui`
(`npx shadcn add <name>`), don't work around the lint rule.

**Findings.** Audit findings (review, Playwright/visual, UX, design
detector) are Markdown files under `findings/<type>/NNNN-<slug>.md` with
front matter `type, severity (blocking|major|minor), status
(open|fixed|wontfix), slice, source, evidence`. Evidence goes in
`findings/_evidence/`.

**Never**: edit `main` directly, skip a hook, hand-edit `.env.local` or
`types/database.ts`, add business logic to a route handler/Server
Action/Postgres function instead of a `service.ts`, or `db reset` from
outside your own slot's satellite dir.

## Skills

Vendored agent skills live in `.claude/skills/<name>/`, copied from upstream at
a pinned commit. Each `SKILL.md` front matter carries `source`, `source_ref`
(the SHA) and `license`; provenance, licences and the full list of local edits
are in [`.claude/skills/THIRD-PARTY-LICENSES.md`](./.claude/skills/THIRD-PARTY-LICENSES.md).

| Skill                              | Load it before                                                             |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `shadcn`                           | Any UI work: adding/composing `components/ui`, styling, forms, icons       |
| `supabase`                         | Anything touching Supabase: Auth, `@supabase/ssr`, CLI, config, debugging  |
| `supabase-postgres-best-practices` | Any migration, schema, RLS policy, index, trigger or slow query            |
| `vercel-react-best-practices`      | Writing/reviewing React or Next.js: data fetching, re-renders, bundle size |

They are edited to point at this repo: the shadcn skill runs the CLI as
`pnpm dlx` (never `npx`/`bunx`), reads `components.json` statically instead of
shelling out on load, and treats the Critical Rules as `@shadcn/lint` gates;
both Supabase skills open with this repo's non-negotiables (API-first services,
no business logic in Postgres, RLS as defence in depth, roles from
`raw_app_meta_data`, forward-only migrations). **Where a skill and this file
disagree, this file wins.**

`pnpm skills:check` asserts every relative Markdown link under `.claude/skills`
still resolves -- run it after editing or refreshing a skill. The directory is
in `.prettierignore` so the vendored text stays byte-faithful to its upstream
SHA; don't reformat it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
