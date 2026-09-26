# Contributing

See [`AGENTS.md`](./AGENTS.md) for the service-layer, API-first and
software-factory conventions this repo follows.

## Dev setup

```bash
git clone <repo-url>
cd nextjs-template
pnpm bootstrap
pnpm dev
```

## Code standards

- No semicolons, single quotes, 2-space indentation, 100-char line width
  (enforced by `pnpm lint`, which runs ESLint + `@shadcn/lint` + Prettier).
- Path alias: `@/` (e.g. `import { cn } from 'cn'`).
- TypeScript strict mode.
- Business logic lives in `lib/<domain>/service.ts`, never in a route
  handler, Server Action, or Postgres function -- see AGENTS.md.

## PR checklist

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test:unit`
- [ ] `pnpm test:db` (if `supabase/migrations/` changed)
- [ ] `pnpm api:check` (if `app/api/v1/**` or a domain's `schemas.ts` changed)
- [ ] `pnpm e2e:baseline`
