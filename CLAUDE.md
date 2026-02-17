# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js application template with a **Travel Bucket List** dashboard theme. Built with a **UX-first, mock-data-driven** philosophy: interfaces are built with realistic mock data before any backend exists. All integrations (Supabase, Stripe, Anthropic, Resend) are optional — the app runs fully with zero env vars.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint` / `pnpm lint:fix`
- **Format:** `pnpm format` / `pnpm format:check`
- **Unit tests:** `pnpm test` (Vitest, all tests)
- **Single test file:** `pnpm test -- lib/badge-utils.test.ts`
- **Test watch mode:** `pnpm test:watch`
- **Test coverage:** `pnpm test:coverage`
- **E2E tests:** `pnpm test:e2e` (Playwright, auto-starts dev server)
- **E2E single file:** `pnpm test:e2e -- e2e/dashboard.spec.ts`
- **All tests:** `pnpm test:all` (unit + E2E)

## Architecture

### Routing & Pages

Next.js App Router with nested layouts:
- `app/layout.tsx` — Root: ThemeProvider → QueryProvider → Header/Footer shell
- `app/dashboard/layout.tsx` — Dashboard: adds collapsible Sidebar
- Pages: `/` (marketing landing), `/guide`, `/login`, `/signup`, `/dashboard`, `/dashboard/trips`, `/dashboard/destinations`, `/dashboard/settings`

### Data Flow

Component → React Query hook (`lib/api.ts`) → fetch to API route (`app/api/`) → mock data (`lib/mock-data.ts`) → cached response → component renders with loading/error/data states.

To migrate to a real backend: swap the fetch URLs in the React Query hooks in `lib/api.ts` — each hook has a commented-out example. The component layer stays unchanged.

### State Management

- **React Query** (`lib/api.ts`) — Server data: `useTrips()`, `useDestinations()`, `useTripTasks()`, `useDashboardSummary()`. Hooks fetch from internal API routes with simulated delays.
- **Zustand** (`lib/store.ts`) — UI-only: `sidebarCollapsed` (persisted to localStorage under key `'app-store'`), `theme`, `activeModal`.

### API Response Shape

All API routes return `APIResult<T>`:
```ts
{ success: true, data: T } | { success: false, error: { code: string, message: string } }
```

### Authentication (Dual Mode)

**Dummy auth** (default, no env vars): `lib/auth.ts` manages cookie `app-template-session`. Header shows "Login" or "Dashboard" based on cookie presence. Middleware redirects unauthenticated `/dashboard/*` to `/login`.

**Supabase auth** (when `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set): `lib/auth-actions.ts` server actions handle signUp/signIn/signOut/OAuth. Middleware delegates to `updateSession()` which redirects unauthenticated `/dashboard/*` to `/`.

### Middleware (`middleware.ts`)

Three concerns in order:
1. **Rate limiting** — `/api/*` routes (skips `/api/webhooks/*`). In-memory sliding window, 60 req/60s.
2. **Supabase session refresh** — when Supabase is configured, handles JWT refresh + route protection.
3. **Dummy auth fallback** — when Supabase is NOT configured, checks cookie for `/dashboard/*` access.

### Integrations (`lib/env.ts`)

All integrations use feature detection — `isSupabaseConfigured()`, `isStripeConfigured()`, `isAnthropicConfigured()`, `isResendConfigured()`. Missing env vars disable the feature rather than crashing. Integration clients follow a lazy singleton pattern returning `null` when not configured.

### Component Organization

- `components/ui/` — shadcn/ui primitives. Add new ones via `npx shadcn-ui@latest add <component>`.
- `components/layout/` — Header (client, auth-aware), Sidebar (client, Zustand), Footer.
- `components/providers/` — QueryProvider (60s stale time, no refetch on window focus), ThemeProvider.
- `components/` root — Feature components: TripsList, DestinationsTable, TripTasksBoard, DashboardCharts, DashboardContent, TravelerProfileForm, ThemeToggle.
- `types/index.ts` — All shared types: Trip, Destination, TripTask, DashboardSummary, API types, nav types.
- `lib/constants.ts` — Navigation items, sidebar items, footer links, app name.

## Testing

### Setup & Mocks

- **Custom render** (`test/test-utils.tsx`) — Wraps components in QueryClientProvider with `retry: false` and `gcTime: Infinity`. Import `render` from `@/test/test-utils` instead of `@testing-library/react`.
- **Next.js mocks** (`test/mocks/next.tsx`) — Mocks `next/image` → `<img>`, `next/link` → `<a>`, `next/navigation` → controllable pathname + stub router. Must be imported explicitly: `import '@/test/mocks/next'`.
- **Controllable pathname** — `import { setMockPathname } from '@/test/mocks/next'` then call `setMockPathname('/dashboard/trips')` before rendering.
- **Vitest globals** — `describe`, `it`, `expect`, `vi`, `beforeEach` etc. are available without importing (configured in `vitest.config.ts` and `tsconfig.json`).

### Patterns

- Component tests with async data: use `waitFor(() => { ... }, { timeout: 2000 })`.
- Theme tests: `vi.mock('next-themes', ...)` to mock `useTheme`.
- Form tests: `vi.mock('sonner', ...)` to mock toast.
- Chart tests: wrap `ResponsiveContainer` in a fixed-size div (jsdom has no layout engine).
- Zustand: reset state with `useAppStore.setState({...})` in `beforeEach`, not action methods.
- `formatBudget` uses `en-AU` locale with AUD currency — assert with `toContain` to avoid locale differences.

### E2E Tests

- Playwright runs on Chromium only, auto-starts dev server.
- Dashboard tests require auth — set cookie before navigation:
  ```ts
  await page.context().addCookies([{
    name: 'app-template-session', value: 'true',
    domain: 'localhost', path: '/',
  }])
  ```
- This helper is duplicated in each E2E spec file (no shared E2E utility file).

## Branding

### Colors (Tailwind classes)

Brand colors in `tailwind.config.ts` use a neutral slate/zinc scale:
- **Primary:** `brand-900` (#0f172a), `brand-700` (#334155), `brand-400` (#94a3b8)
- **Secondary:** `brand-500` (#71717a), `brand-amber` (#f59e0b)
- **Greys:** `brand-grey-800` through `brand-grey-100` (7 shades, slate scale)

Semantic colors (primary, secondary, muted, accent, destructive, etc.) use HSL CSS custom properties defined in `app/globals.css`, toggled between light (`:root`) and dark (`.dark`) via `next-themes`.

## Code Style

- **No semicolons**, single quotes, 2-space indent, ES5 trailing commas, 100 char print width (`.prettierrc`)
- ESLint extends `next/core-web-vitals`, `next/typescript`, `prettier`
- Path alias: `@/*` maps to project root (e.g., `import { cn } from '@/lib/utils'`)

## Mock Data

`lib/mock-data.ts` contains: 8 trips across continents, 10 destinations with type/season/cost variety, 12 trip tasks across 4 kanban columns (To Research/Booking/Confirmed/Done), and a computed dashboard summary.
