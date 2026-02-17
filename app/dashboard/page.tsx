/**
 * Dashboard home page.
 *
 * Displays summary cards, a trips table, and charts via React Query hooks,
 * with loading skeletons and error states.
 */

import type { Metadata } from 'next'
import { DashboardContent } from '@/components/DashboardContent'
import { DashboardCharts } from '@/components/DashboardCharts'

export const metadata: Metadata = {
  title: 'Travel Dashboard',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Travel Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your trips and destinations.
        </p>
      </div>

      <DashboardContent />

      <DashboardCharts />
    </div>
  )
}
