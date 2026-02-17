/**
 * Developer Guide — condensed reference for building features with this template.
 *
 * Content distilled from docs/framework.md, README.md, and CLAUDE.md. Covers
 * quick start, architecture, workflow, common tasks, branding, testing, and
 * deployment. The page is a Server Component with flat Card layout for easy
 * scanning and Ctrl+F.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Rocket,
  GitBranch,
  BookOpen,
  Zap,
  Code2,
  TestTube,
  Upload,
  FileText,
} from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Hero / Introduction                                            */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Developer Guide</h1>
        <p className="mt-2 text-muted-foreground">
          This template is a production-ready foundation for internal applications.
          It follows a <strong>UX-first, mock-data-driven</strong> philosophy: build and validate
          interfaces with mock data before committing to backend or data models. The component layer
          stays unchanged when you swap to real APIs.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Quick Start                                                    */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-brand-700" />
            <CardTitle>Quick Start</CardTitle>
          </div>
          <CardDescription>Get the dev server running in under a minute</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Prerequisites</h3>
            <p className="text-sm text-muted-foreground">
              Node.js 18+ (LTS recommended) and{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">pnpm</code>{' '}
              (<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
                npm install -g pnpm
              </code>{' '}
              if not installed).
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold">Setup</h3>
            <pre className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
{`pnpm install      # install dependencies
pnpm dev           # start dev server → http://localhost:3000`}
            </pre>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold">Usage Models</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>Clone-per-project</strong> — clone the repo, rename, delete example pages,
                add your own
              </li>
              <li>
                <strong>Single-app extension</strong> — add pages, components, and API routes
                alongside the existing examples
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            See <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">docs/framework.md</code> §1 for
            full setup details.
          </p>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Development Workflow                                           */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-brand-700" />
            <CardTitle>Development Workflow</CardTitle>
          </div>
          <CardDescription>Mock-first philosophy and end-to-end feature recipe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Every feature starts with mock data. Define your types and fake data first, build the
            full UI with loading, error, and empty states, then swap to real APIs when the backend is
            ready. The component layer never changes — only the fetch function inside the React Query
            hook.
          </p>

          <div>
            <h3 className="mb-2 text-sm font-semibold">End-to-End Feature Workflow</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>
                Define types →{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">types/index.ts</code>
              </li>
              <li>
                Add mock data →{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">lib/mock-data.ts</code>
              </li>
              <li>
                Create API route →{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{'app/api/<entity>/route.ts'}</code>
              </li>
              <li>
                Add React Query hook →{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">lib/api.ts</code>
              </li>
              <li>
                Build feature component →{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">components/</code>
              </li>
              <li>
                Create page (e.g.{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">app/dashboard/trips/page.tsx</code>
                )
              </li>
              <li>
                Add to navigation →{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">lib/constants.ts</code>
              </li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground">
            See <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">docs/framework.md</code> §3e for a
            full worked example with code snippets.
          </p>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Architecture & Key Concepts                                    */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-700" />
            <CardTitle>Architecture &amp; Key Concepts</CardTitle>
          </div>
          <CardDescription>Layout nesting, state management, and data flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Layout Nesting</h3>
            <pre className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
{`Root Layout (app/layout.tsx)
└─ ThemeProvider → QueryProvider
   ├─ <Header />           ← always visible
   ├─ <main>
   │   ├─ / and /guide     ← full-width content
   │   └─ Dashboard Layout (app/dashboard/layout.tsx)
   │       ├─ <Sidebar />  ← collapsible, client component
   │       └─ page content  ← flex-1, overflow-auto
   └─ <Footer />           ← always visible`}
            </pre>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">State Management</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-semibold">What</th>
                    <th className="pb-2 pr-4 font-semibold">Tool</th>
                    <th className="pb-2 font-semibold">Where</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Server / API data</td>
                    <td className="py-2 pr-4">React Query</td>
                    <td className="py-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">lib/api.ts</code>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">UI state (sidebar, theme, modals)</td>
                    <td className="py-2 pr-4">Zustand</td>
                    <td className="py-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">lib/store.ts</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Form state</td>
                    <td className="py-2 pr-4">React Hook Form + Zod</td>
                    <td className="py-2">Component-local</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Server vs Client Components</h3>
            <p className="text-sm text-muted-foreground">
              Server Components are the default. Only add{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {`'use client'`}
              </code>{' '}
              when a component uses React hooks, event handlers, Zustand, or browser-only APIs.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            See <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">docs/framework.md</code> §2 for the
            full architecture diagram and data flow.
          </p>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Common Tasks                                                   */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-700" />
            <CardTitle>Common Tasks</CardTitle>
          </div>
          <CardDescription>Quick-reference for everyday operations</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>Add a page</strong> — create{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{'app/<route>/page.tsx'}</code>, add to{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">NAVIGATION_ITEMS</code> or{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">SIDEBAR_ITEMS</code>
            </li>
            <li>
              <strong>Add an API route</strong> — create{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{'app/api/<entity>/route.ts'}</code>{' '}
              returning{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{'APIResult<T>'}</code>
            </li>
            <li>
              <strong>Add a shadcn component</strong> —{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{'npx shadcn-ui@latest add <name>'}</code>{' '}
              installs to{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">components/ui/</code>
            </li>
            <li>
              <strong>Swap mock → real API</strong> — in the React Query hook, uncomment the fetch
              block and remove the mock data import
            </li>
            <li>
              <strong>Add to sidebar nav</strong> — add an entry to{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">SIDEBAR_ITEMS</code> in{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">lib/constants.ts</code>
            </li>
          </ul>

          <p className="mt-4 text-xs text-muted-foreground">
            See <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">docs/framework.md</code> §3 for
            step-by-step recipes with code snippets.
          </p>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 6. Technology Stack                                               */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-brand-700" />
            <CardTitle>Technology Stack</CardTitle>
          </div>
          <CardDescription>Core technologies powering this template</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>Next.js 14</strong> — App Router, Server Components, file-based routing
            </li>
            <li>
              <strong>TypeScript</strong> — Strict mode with shared type definitions
            </li>
            <li>
              <strong>Tailwind CSS</strong> — Utility-first styling with brand tokens
            </li>
            <li>
              <strong>shadcn/ui</strong> — Accessible component library (Button, Card, Form, Table,
              Badge)
            </li>
            <li>
              <strong>React Query 5</strong> — Server state, caching, loading/error states
            </li>
            <li>
              <strong>Zustand 5</strong> — Client UI state (sidebar, theme, modals)
            </li>
            <li>
              <strong>React Hook Form + Zod</strong> — Form validation and field management
            </li>
            <li>
              <strong>Recharts</strong> — React charting library built on D3 for data visualisation
            </li>
            <li>
              <strong>@dnd-kit</strong> — Modular drag-and-drop toolkit (core, sortable, utilities)
            </li>
            <li>
              <strong>Lucide React</strong> — Icon library for consistent iconography
            </li>
            <li>
              <strong>Vitest</strong> — Unit and component testing
            </li>
            <li>
              <strong>Playwright</strong> — End-to-end browser testing
            </li>
            <li>
              <strong>ESLint + Prettier</strong> — Linting and formatting configured
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 7. Testing & Quality                                              */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-brand-700" />
            <CardTitle>Testing &amp; Quality</CardTitle>
          </div>
          <CardDescription>Test commands and quality principles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-semibold">Command</th>
                  <th className="pb-2 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm test</code>
                  </td>
                  <td className="py-2">Run unit/component tests (Vitest)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm test:watch</code>
                  </td>
                  <td className="py-2">Watch mode for TDD workflow</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm test:e2e</code>
                  </td>
                  <td className="py-2">End-to-end tests (Playwright, auto-starts dev server)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm test:all</code>
                  </td>
                  <td className="py-2">Run both unit and E2E tests</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm lint</code>
                  </td>
                  <td className="py-2">Check lint issues (ESLint + Prettier)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Principles</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Every data component handles loading, error, and empty states</li>
              <li>
                Use skeleton loaders (<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">animate-pulse</code>),
                never spinners
              </li>
              <li>
                Use the custom render from{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">test-utils</code> to wrap
                components with providers
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 8. Deployment                                                     */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-brand-700" />
            <CardTitle>Deployment</CardTitle>
          </div>
          <CardDescription>Build checklist and environment variable setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Build Checklist</h3>
            <pre className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
{`pnpm build        # must complete without errors
pnpm lint          # must pass
pnpm test:all      # run all tests
pnpm start         # verify production build locally`}
            </pre>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Environment Variables</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                Local:{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env.local</code> (not committed
                to git)
              </li>
              <li>Production: set in Vercel dashboard → Project Settings → Environment Variables</li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_*</code> prefix
                exposes values to the browser; omit prefix for server-only secrets
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            See <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">docs/framework.md</code> §6 for
            Vercel, Docker, and static export deployment options.
          </p>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* 9. Resources                                                      */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-700" />
            <CardTitle>Resources</CardTitle>
          </div>
          <CardDescription>Documentation files and key directories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Documentation</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">docs/framework.md</code> —
                Complete framework guide with step-by-step recipes
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">CLAUDE.md</code> — AI agent
                instructions and project overview
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">README.md</code> — Project
                README with setup instructions
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Key Directories</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">components/ui/</code> —
                shadcn/ui primitives (Badge, Button, Card, Form, Label, Table)
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">lib/</code> — API hooks, Zustand
                store, mock data, constants, utilities
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">app/api/</code> — API route
                handlers returning{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{'APIResult<T>'}</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">types/</code> — All shared
                TypeScript types and interfaces
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
