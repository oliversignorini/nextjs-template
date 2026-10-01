---
name: supabase-postgres-best-practices
source: https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices
source_ref: 544bfc56c89afe2b87b20017a59b2c6e9502a1fb
description: "Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns (including choosing column types), schema design, migrations and declarative schema files, RLS policies and the tests that verify them, indexes, triggers, database functions, queues and scheduled jobs (pg_cron, pgmq), vector/semantic search (pgvector), and restoring dumps (pg_restore) or importing data. Also load it when diagnosing slow queries, high CPU, timeouts, EXPLAIN plans, connection exhaustion, locking, bloat, or rows visible to the wrong user or tenant. This is not just a performance guide — schema, migration, security, and SQL authoring tasks need these rules too, even for a one-column change or a single query."
license: MIT
metadata:
  author: supabase
  version: "1.1.1"
  organization: Supabase
  date: January 2026
  abstract: Comprehensive Postgres performance optimization guide for developers using Supabase and Postgres. Contains performance rules across 8 categories, prioritized by impact from critical (query performance, connection management) to incremental (advanced features). Each rule includes detailed explanations, incorrect vs. correct SQL examples, query plan analysis, and specific performance metrics to guide automated optimization and code generation.
---

# Supabase Postgres Best Practices

## This repo's non-negotiables (read first)

Vendored for the `next-supabase-vercel` template. Where this skill and
[`AGENTS.md`](../../../AGENTS.md) disagree, **AGENTS.md wins.**

- **API-first. No business logic in Postgres.** Every capability lives in a
  service function in `lib/<domain>/service.ts`, taking a Supabase client
  already scoped to the acting user. Route handlers (`app/api/v1/**`) and the
  UI's Server Components/Actions call the *same* service function. Supabase is
  storage + auth only — do not move control flow into an RPC, a trigger or a
  Postgres function, however tempting the transaction guarantees are.
- **RLS is defence in depth, not the check.** Every table has RLS enabled, no
  exceptions — `supabase/tests/000_rls.test.sql` asserts that generically
  against `pg_tables`/`pg_policies`, so a new table with no RLS or no policy
  fails the suite automatically. The authoritative check still lives in the
  service function.
- **Roles come from `auth.users.raw_app_meta_data`, never
  `raw_user_meta_data`.** `user_metadata` is client-settable with only the anon
  key, so trusting it for a role decision is privilege escalation. Only the
  service role can write `app_metadata`.
- **Migrations are forward-only.** `supabase/migrations/` holds every schema
  change, timestamped (reset order depends on the filename), and there is no
  `down` file — get the `up` right the first time, and never make a
  destructive change without a plan for existing data.
- **Regenerate types after every migration:** `pnpm gen:types` rewrites
  `types/database.ts`. Never hand-edit that file.
- **No client-side `supabase.from()`/`.rpc()` from the browser.**
- Local stack: `pnpm env:up` / `pnpm env:reset` (per-slot), pgTAP via
  `pnpm test:db`. Only Postgres, Auth and Mailpit are enabled in
  `supabase/config.toml`; storage, realtime, analytics and edge_runtime are
  deliberately off.


Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## How to Use

Read individual rule files for detailed explanations and SQL examples:

```
references/query-missing-indexes.md
references/query-partial-indexes.md
references/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes (when applicable)

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
