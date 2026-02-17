'use client'

import { useMemo } from 'react'
import { useTrips } from '@/lib/api'
import { formatBudget } from '@/lib/badge-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  Dreaming: '#94a3b8',
  Planning: '#f59e0b',
  Booked: '#059669',
  Completed: '#64748b',
  Cancelled: '#dc2626',
}

const CONTINENT_COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#475569']

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-5 w-32 rounded bg-border" />
            <div className="mt-1 h-3 w-48 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardCharts() {
  const { data: trips, isLoading, error } = useTrips()

  const budgetByContinent = useMemo(() => {
    if (!trips) return []
    const grouped: Record<string, number> = {}
    for (const trip of trips) {
      grouped[trip.continent] = (grouped[trip.continent] ?? 0) + trip.budget
    }
    return Object.entries(grouped)
      .map(([continent, budget]) => ({ continent, budget }))
      .sort((a, b) => b.budget - a.budget)
  }, [trips])

  const tripsByStatus = useMemo(() => {
    if (!trips) return []
    const grouped: Record<string, number> = {}
    for (const trip of trips) {
      grouped[trip.status] = (grouped[trip.status] ?? 0) + 1
    }
    return Object.entries(grouped).map(([status, count]) => ({ status, count }))
  }, [trips])

  if (isLoading) return <ChartsSkeleton />

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">Failed to load chart data. Please try refreshing the page.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Budget by Continent - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Budget by Continent</CardTitle>
          <CardDescription>Total trip budget per continent.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetByContinent} layout="vertical">
              <XAxis
                type="number"
                tickFormatter={(v: number) => formatBudget(v)}
                fontSize={12}
              />
              <YAxis type="category" dataKey="continent" width={120} fontSize={12} />
              <Tooltip
                formatter={(value) => [formatBudget(Number(value)), 'Budget']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="budget" radius={[0, 4, 4, 0]}>
                {budgetByContinent.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CONTINENT_COLORS[index % CONTINENT_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trips by Status - Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trips by Status</CardTitle>
          <CardDescription>Distribution of trips across statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tripsByStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="count"
                nameKey="status"
                paddingAngle={2}
                label={({ name, value }) => `${name} (${value})`}
                labelLine={false}
              >
                {tripsByStatus.map((entry) => (
                  <Cell
                    key={`cell-${entry.status}`}
                    fill={STATUS_COLORS[entry.status] ?? '#AEB7BC'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
