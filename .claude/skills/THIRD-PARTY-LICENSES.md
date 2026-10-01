# Third-party licences — vendored agent skills

Everything under `.claude/skills/` is third-party content, vendored (copied) at
a pinned upstream commit. Each skill's `SKILL.md` front matter carries its
`source`, `source_ref` (the exact commit SHA vendored) and `license`.

Local edits are applied on top of the upstream text to point the skill at this
template's conventions; they are noted per skill below. To refresh a skill,
re-fetch from `source` at a newer SHA, re-apply the edits, and update
`source_ref`.

---

## `shadcn/`

- **Upstream:** <https://github.com/shadcn-ui/ui> — `skills/shadcn`
- **Commit:** `b0fcb58a6e7c4df1a88f7f6327b083592c2dfd9c`
- **Licence:** MIT

```
MIT License

Copyright (c) 2023 shadcn
```

Local edits:

- Runner changed from `npx` / `bunx --bun` to `pnpm dlx` throughout;
  `allowed-tools` narrowed to `Bash(pnpm dlx shadcn@latest *)` to match.
- The `` !`npx shadcn@latest info --json` `` command-injection block in
  "Current Project Context" replaced with a static pointer to
  `components.json`, `components/ui/` and `app/globals.css`, so loading the
  skill makes no network or CLI call.
- Added a "This repo (read first)" preamble: `components.json` is the config,
  `components/ui` holds the installed components, and Critical Rule violations
  fail `@shadcn/lint` (a `pnpm lint` / CI gate), not merely advice.
- `rules/chat.md` and `mcp.md` removed as out of scope; the "Chat & Messaging"
  rules section, the chat row of the Component Selection table, the
  `rules/chat.md` entry under Detailed References, the chat-nesting paragraph in
  `rules/composition.md` and the "including chat interfaces" clause of the
  description were removed with them, so no link dangles.
- `rules/base-vs-radix.md` deliberately **kept**: this template's primitive base
  is `radix` and app code uses `asChild`.

## `supabase/`

- **Upstream:** <https://github.com/supabase/agent-skills> — `skills/supabase`
- **Commit:** `544bfc56c89afe2b87b20017a59b2c6e9502a1fb`
- **Licence:** MIT

```
MIT License

Copyright (c) 2026 Supabase
```

Local edits: a "This repo's non-negotiables (read first)" header block added
below the title (API-first services, no business logic in Postgres RPC, RLS as
defence in depth, roles from `raw_app_meta_data`, forward-only migrations,
`pnpm gen:types`), pointing at `AGENTS.md` as the tie-breaker. Plus `source`,
`source_ref` and `license` front-matter fields.

## `supabase-postgres-best-practices/`

- **Upstream:** <https://github.com/supabase/agent-skills> —
  `skills/supabase-postgres-best-practices`
- **Commit:** `544bfc56c89afe2b87b20017a59b2c6e9502a1fb`
- **Licence:** MIT

```
MIT License

Copyright (c) 2026 Supabase
```

Local edits: the same "This repo's non-negotiables (read first)" header block,
plus `source` and `source_ref` front-matter fields (upstream already declared
`license: MIT`).

## `vercel-react-best-practices/`

- **Upstream:** <https://github.com/vercel-labs/agent-skills> —
  `skills/react-best-practices` (published as `vercel-react-best-practices`)
- **Commit:** `063bee94c3f4df8453406c830b0a7df0f2860278`
- **Licence declared:** MIT (from the skill's own `SKILL.md` front matter)

> **⚠️ Licence caveat.** `vercel-labs/agent-skills` ships **no `LICENSE` file**
> at the repository root, and no `package.json` `license` field covering the
> skills. The only licence statement is `license: MIT` in this skill's own
> `SKILL.md` front matter — which is the upstream author's declaration, but is
> not accompanied by the MIT text or a copyright line. We therefore cannot
> reproduce an upstream copyright notice here. Content is attributed to Vercel
> Engineering (`metadata.author: vercel`, `metadata.organization: "Vercel
> Engineering"`). If stricter provenance is needed, ask upstream to add a
> `LICENSE` file before relying on this skill in a distributed product.

Local edits: `source` and `source_ref` front-matter fields added; the upstream
`license: MIT` and the rule content kept verbatim. Three relative links in the
skill's own `AGENTS.md` were repaired (`./async-defer-await.md`,
`./async-cheap-condition-before-await.md`, `./server-hoist-static-io.md` ->
`./rules/...`); they are broken upstream too. Apart from those four lines the
vendored copy is byte-identical to upstream at the commit above (verified with
`diff -rq` against the tarball before editing).
