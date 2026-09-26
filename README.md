# nextjs-template

Software-factory template for the `next-supabase-vercel` stack profile:
Next.js (App Router), TypeScript strict, Tailwind v4 + shadcn/ui, local
Supabase (Postgres, Auth, Mailpit) with RLS on every table, a versioned
HTTP JSON API with a generated OpenAPI spec, and Vitest/pgTAP/Playwright
tests.

See [`AGENTS.md`](./AGENTS.md) for the full contract, conventions and
software-factory commands. This file is the quick start.

## Prerequisites

- Node.js 22+, pnpm 9+
- Docker (for the local Supabase stack)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (installed as a
  devDependency; use `pnpm exec supabase`)

## Getting started

```bash
pnpm bootstrap   # install deps, start Supabase, migrate + seed demo data
pnpm dev         # http://localhost:3000
```

Sign in at `/login` as `member@demo.test` / `demo-password-123` (password
`demo-password-123` for every seeded user -- see AGENTS.md > Demo data).

## Everyday commands

| Command             | What it does                                                  |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Run the app (slot-aware: `pnpm dev:slot` under the factory)     |
| `pnpm env:up`/`env:down`/`env:reset` | Manage the local Supabase stack                |
| `pnpm lint` / `pnpm typecheck` | ESLint + `@shadcn/lint` + Prettier / `tsc --noEmit`   |
| `pnpm test:unit`     | Vitest, DB-free                                               |
| `pnpm test:db`       | pgTAP against the local Supabase stack                        |
| `pnpm e2e` / `pnpm e2e:baseline` | Playwright (full suite / the specs CI runs)      |
| `pnpm api:generate` / `pnpm api:check` | Regenerate `openapi.json` / fail on drift  |
| `pnpm design:check`  | impeccable design detector                                    |

Full command reference, the slot/worktree isolation model, and the
service-layer/API-first rules are in [`AGENTS.md`](./AGENTS.md).
