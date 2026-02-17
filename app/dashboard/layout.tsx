/**
 * Dashboard layout — adds a collapsible Sidebar alongside page content.
 *
 * Nested inside the root layout, so Header and Footer are inherited.
 * All routes under `/dashboard/*` share this sidebar navigation.
 */

import { Sidebar } from '@/components/layout/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">
        <Breadcrumbs className="mb-4" />
        {children}
      </div>
    </div>
  )
}
