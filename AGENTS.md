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
  (`lib/api/errors.ts`). List endpoints use cursor pagination
  (`lib/api/pagination.ts`). Creates accept an `Idempotency-Key` header.

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

- Every table has RLS enabled, no exceptions (`supabase/tests/*.test.sql`
  asserts this and exercises per-role access).
- `supabase/migrations/` holds every schema change, timestamped filenames
  (`supabase db reset` order depends on it). `supabase/seed.sql` is
  schema-level seed data only; demo _users_ are created via the Admin API
  by `scripts/supabase/seed.ts` (`pnpm env:reset` runs it) because
  `auth.users` rows need GoTrue, not raw SQL.
- Regenerate `types/database.ts` after every migration: `pnpm gen:types`
  (also runs automatically as the last step of `env:reset`).
- Migration-safety review: whenever `supabase/migrations/` changes, treat it
  like a production schema change -- no destructive change without a plan
  for existing data, no missing `down` story (Supabase migrations are
  forward-only here, so get the `up` right).
- `supabase/config.toml` only enables Postgres, Auth and Mailpit (`api`,
  `db`, `auth`, `local_smtp`, `studio`) -- this profile's contract.
  `storage`, `realtime`, `analytics` and `edge_runtime` are disabled: they
  aren't used by the demo resource, cost real RAM on a shared factory host,
  and (analytics/edge_runtime) have ports `scripts/factory/factory.mjs`
  doesn't remap per slot. Re-enable per-app if a feature needs one, and add
  its port(s) to `BASE_PORTS` in `factory.mjs` first if you do.

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
| `pnpm health`              | Exit 0 when `GET /api/health` on this slot returns 200                        |
| `pnpm lint`                | ESLint (incl. `@shadcn/lint`) + Prettier check                                |
| `pnpm typecheck`           | `tsc --noEmit`                                                                |
| `pnpm test:unit`           | Vitest, DB-free (mocked Supabase clients)                                     |
| `pnpm test:db`             | `supabase test db` -- pgTAP: RLS-enabled + per-role access on every table     |
| `pnpm e2e`                 | Playwright against this slot (starts `dev:slot` if it isn't running)          |
| `pnpm e2e:baseline`        | The e2e specs CI runs: `skeleton.spec.ts` + `api.spec.ts`                     |
| `pnpm design:check`        | impeccable design detector over `app` and `components`                        |
| `pnpm api:check`           | Regenerate `openapi.json` and fail on drift                                   |

**Slots.** `FACTORY_SLOT` (0-9) is set by the factory chair per worktree.
Every port is its default + `slot*100` (`node scripts/factory/factory.mjs
ports`). Supabase's `project_id` becomes `nextjs-template-s<slot>` and the
whole stack lives in a per-slot satellite dir (`.factory/supabase-s<slot>/`,
gitignored) so two slots never share a container, volume or port. The
generated `.env.local` carries a `managed-by` header; never hand-edit it --
move it aside and re-run `pnpm env:up` if you need to.

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
