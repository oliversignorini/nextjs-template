# Contributing

Internal guidelines for contributing to the application template.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) (package manager)

## Dev Setup

```bash
git clone <repo-url>
cd app-template
cp .env.local.example .env.local
pnpm install
pnpm dev
```

## Code Standards

- **No semicolons**, single quotes, 2-space indentation, 100-char line width
- **Path aliases:** Use `@/` imports (e.g. `import { cn } from '@/lib/utils'`)
- **TypeScript:** Strict mode — no `any`, no implicit types on public APIs
- **JSDoc:** All source files must have file-level JSDoc. Exported functions must have `@param` and `@returns` tags.
- **Components:** Server Components by default. Add `'use client'` only when interactivity is needed.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add project detail page
fix: correct sidebar active state on nested routes
docs: update component catalogue
refactor: extract badge colour logic to badge-utils
test: add E2E tests for dashboard navigation
```

## PR Checklist

Before submitting a pull request, verify:

- [ ] `pnpm lint` passes with no warnings
- [ ] `pnpm format:check` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes (unit + component tests)
- [ ] `pnpm test:e2e` passes (E2E tests)
- [ ] New files have file-level JSDoc
- [ ] New components follow the loading/error/empty/data state pattern

## Adding Features

See [docs/framework.md](docs/framework.md) for step-by-step recipes covering:

- Adding new pages and dashboard sub-pages
- Creating React Query hooks
- Adding shadcn/ui components
- Connecting to real APIs
- Writing tests
