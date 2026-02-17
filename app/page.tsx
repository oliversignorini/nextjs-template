/**
 * Marketing landing page — showcases template features and tech stack.
 *
 * Serves as the lead magnet: compelling hero, feature highlights, tech
 * stack overview, and call-to-action. Remains a Server Component.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard, GripVertical, FileText, Lock, Moon } from 'lucide-react'

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard & Charts',
    description:
      'Interactive dashboard with summary cards, data tables, and Recharts visualisations — all powered by React Query with loading skeletons.',
  },
  {
    icon: GripVertical,
    title: 'Drag & Drop Kanban',
    description:
      'Fully functional Kanban board built with @dnd-kit. Drag tasks between columns with smooth animations and instant state updates.',
  },
  {
    icon: FileText,
    title: 'Forms & Validation',
    description:
      'Production-ready forms with React Hook Form, Zod schema validation, and toast notifications. All wired up and ready to customise.',
  },
]

const EXTRA_FEATURES = [
  {
    icon: Lock,
    title: 'Auth Ready',
    description:
      'Dummy auth out of the box with cookie-based sessions. Swap in Supabase Auth when you are ready — the middleware is already wired up.',
  },
  {
    icon: Moon,
    title: 'Dark Mode',
    description:
      'System-aware dark mode via next-themes with a one-click toggle. Brand colours adapt seamlessly across light and dark themes.',
  },
]

const TECH_STACK = [
  'Next.js 14',
  'TypeScript',
  'Tailwind CSS',
  'shadcn/ui',
  'React Query',
  'Zustand',
  'React Hook Form',
  'Zod',
  'Recharts',
  '@dnd-kit',
  'Lucide',
  'Vitest',
  'Playwright',
]

export default function Home() {
  return (
    <div className="bg-muted">
      {/* Hero */}
      <section className="bg-brand-900 px-4 py-20 text-white dark:bg-background sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Ship Your Next.js App Faster</h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            A production-ready template with dashboard, charts, Kanban board, forms, auth, and dark
            mode — all wired up so you can focus on your product, not boilerplate.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">Explore the Dashboard</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/guide">Read the Guide</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features — 3 cards */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-primary">
          Everything You Need to Get Started
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-900/10">
                  <feature.icon className="h-5 w-5 text-brand-700" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* More Features — 2 cards */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {EXTRA_FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-900/10">
                  <feature.icon className="h-5 w-5 text-brand-700" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-primary">Tech Stack</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-900 px-4 py-16 text-white dark:bg-background sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-3xl font-bold">Ready to Build?</h2>
          <p className="text-white/80">
            Clone the template, explore the guide, and start shipping.
          </p>
          <Button asChild size="lg">
            <Link href="/guide">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
