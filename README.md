# Next.js App Template

A production-ready Next.js 14 application template with comprehensive mock data and modern development tooling. Serves as the foundation for internal applications.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) (package manager)

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

| Command              | Description                          |
|----------------------|--------------------------------------|
| `pnpm dev`           | Start development server             |
| `pnpm build`         | Create production build              |
| `pnpm start`         | Start production server              |
| `pnpm lint`          | Run ESLint                           |
| `pnpm lint:fix`      | Run ESLint with auto-fix             |
| `pnpm format`        | Format code with Prettier            |
| `pnpm format:check`  | Check formatting without changes     |
| `pnpm test`          | Run unit + component tests (Vitest)  |
| `pnpm test:watch`    | Run tests in watch mode              |
| `pnpm test:ui`       | Open Vitest browser UI               |
| `pnpm test:coverage` | Run tests with coverage report       |
| `pnpm test:e2e`      | Run E2E tests (Playwright)           |
| `pnpm test:e2e:ui`   | Open Playwright test UI              |
| `pnpm test:all`      | Run all tests (unit + E2E)           |

## Tech Stack

| Category        | Technology                                          |
|-----------------|-----------------------------------------------------|
| Framework       | Next.js 14 (App Router, Server Components), React 18 |
| Language        | TypeScript (strict mode)                            |
| Styling         | Tailwind CSS 3.4, shadcn/ui (Radix primitives)     |
| Server State    | TanStack React Query 5                              |
| Client State    | Zustand 5                                           |
| Forms           | React Hook Form + Zod validation                    |
| Dark Mode       | next-themes (class-based)                           |
| Icons           | Lucide React                                        |
| Font            | Open Sans (via next/font)                           |
| Linting         | ESLint (Next.js + TypeScript + Prettier)            |
| Formatting      | Prettier (no semicolons, single quotes, 100 chars)  |
| Unit Testing    | Vitest, React Testing Library, jsdom                |
| E2E Testing     | Playwright (Chromium)                               |

## Project Structure

```
app-template/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (providers, header, footer)
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles + CSS custom properties
│   ├── about/                  # About page
│   ├── dashboard/              # Dashboard pages (nested layout with sidebar)
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx            # Dashboard home (summary + table)
│   │   ├── projects/           # Projects grid page
│   │   └── users/              # Users table + task board page
│   └── api/                    # API routes
│       ├── projects/route.ts   # GET /api/projects
│       └── users/route.ts      # GET /api/users
├── components/
│   ├── ui/                     # shadcn/ui components (button, card, table, etc.)
│   ├── layout/                 # Header, Sidebar, Footer
│   ├── providers/              # QueryProvider, ThemeProvider
│   ├── ProjectsList.tsx        # Projects grid with loading/error states
│   ├── UsersTable.tsx          # Users table with role badges
│   └── TasksBoard.tsx          # Kanban board (To Do → Done)
├── lib/
│   ├── utils.ts                # cn() utility (clsx + tailwind-merge)
│   ├── api.ts                  # React Query hooks (useProjects, useUsers, useTasks)
│   ├── store.ts                # Zustand store (sidebar, theme, modals)
│   ├── constants.ts            # Navigation items, app name, footer links
│   ├── badge-utils.ts          # Badge styling + formatting utilities
│   └── mock-data.ts            # Mock data (projects, users, tasks)
├── test/
│   ├── setup.ts                # Vitest setup (jest-dom matchers)
│   ├── test-utils.tsx          # Custom render with QueryProvider
│   └── mocks/next.tsx          # Next.js module mocks (Image, Link, navigation)
├── e2e/                        # Playwright E2E tests
├── types/
│   └── index.ts                # Shared TypeScript types
├── public/
│   ├── logos/                  # Logo assets (SVG + PNG, multiple variants)
│   └── icons/                  # Strategy, RAG status, and values icons
├── docs/
│   ├── framework.md            # Step-by-step recipes and patterns
│   ├── PRD.md                  # Product requirements document
│   └── examples/               # Component catalogue and pattern docs
├── ARCHITECTURE.md             # Technical decisions and rationale
├── CONTRIBUTING.md             # Contribution guidelines
└── .env.local.example          # Environment variable template
```

## Architecture

### Routing & Layouts

Uses the Next.js 14 App Router with nested layouts:

- **Root layout** (`app/layout.tsx`) — wraps all pages in ThemeProvider and QueryProvider, renders Header and Footer
- **Dashboard layout** (`app/dashboard/layout.tsx`) — adds a collapsible Sidebar alongside page content

### State Management

State is split by concern:

- **React Query** (`lib/api.ts`) — server/API data fetching with caching, loading states, and error handling. Hooks: `useProjects()`, `useUsers()`, `useTasks()`
- **Zustand** (`lib/store.ts`) — client-only UI state: sidebar collapse, theme preference, active modal

### API Pattern

API routes in `app/api/` return a consistent response shape:

```ts
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

### Mock Data Strategy

The template follows a **UX-first** approach — all interfaces are built with realistic mock data before any backend exists:

1. Mock data lives in `lib/mock-data.ts` (8 projects, 10 users, 12 tasks)
2. React Query hooks in `lib/api.ts` return mock data with simulated network delays
3. Each hook includes commented-out code showing how to swap to real API calls
4. Components render identically regardless of data source

### Server vs Client Components

Server Components are the default (layouts, Header, Footer). Add `'use client'` only when a component needs interactivity (event handlers, hooks, browser APIs).

## Branding

### Colours

All brand colours are available as Tailwind classes via the `brand-*` prefix:

| Category   | Classes                                                            |
|------------|--------------------------------------------------------------------|
| Primary    | `brand-900`, `brand-700`, `brand-400`                             |
| Secondary  | `brand-500`, `brand-amber`                                        |
| Greys      | `brand-grey-800`, `brand-grey-600`, `brand-grey-500`, `brand-grey-400`, `brand-grey-300`, `brand-grey-200`, `brand-grey-100` |
| Accents    | `slate-200`, `emerald-100`, `emerald-600`, `amber-100`, `amber-600` |

Usage: `bg-brand-900`, `text-brand-400`, `border-brand-500`, etc.

Dark mode is supported via CSS custom properties in `app/globals.css` with class-based toggling.

## Testing

### Tools

- **Unit & Component Tests:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **E2E Tests:** [Playwright](https://playwright.dev/) (Chromium)

### File Structure

- Unit tests live alongside source files: `lib/utils.test.ts`, `components/ProjectsList.test.tsx`
- E2E tests live in `e2e/`: `e2e/navigation.spec.ts`, `e2e/dashboard.spec.ts`
- Test utilities in `test/`: setup, custom render, Next.js mocks

### Conventions

- Use the custom `render()` from `@/test/test-utils` for components that use React Query
- Use `@/test/mocks/next` import for components that use `next/image`, `next/link`, or `next/navigation`
- Mock `next-themes` via `vi.mock('next-themes', ...)` in component tests that use `useTheme`
- Component tests with async data should use `waitFor()` with appropriate timeouts

### Writing New Tests

```tsx
// Unit test (lib/my-util.test.ts)
import { myFunction } from './my-util'

describe('myFunction', () => {
  it('does the thing', () => {
    expect(myFunction('input')).toBe('output')
  })
})

// Component test (components/MyComponent.test.tsx)
import '@/test/mocks/next'
import { render, screen } from '@/test/test-utils'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders heading', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

## Adding shadcn/ui Components

```bash
npx shadcn-ui@latest add <component-name>
```

Components are installed to `components/ui/`. The project is already configured via `components.json`.

## Code Style

- No semicolons, single quotes, 2-space indentation
- ES5 trailing commas, 100 character line width
- Path alias: `@/*` maps to project root (e.g., `import { cn } from '@/lib/utils'`)
- ESLint extends `next/core-web-vitals`, `next/typescript`, and `prettier`

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical decisions, provider hierarchy, state boundaries |
| [docs/framework.md](docs/framework.md) | Step-by-step recipes for adding pages, components, and APIs |
| [docs/examples/components.md](docs/examples/components.md) | Component catalogue with usage snippets |
| [docs/examples/patterns.md](docs/examples/patterns.md) | Cross-cutting architectural patterns |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines and PR checklist |

## Deployment

The template is Vercel-ready. Deploy with:

```bash
vercel
```

Or connect your Git repository to [Vercel](https://vercel.com) for automatic deployments.

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for other hosting options.
