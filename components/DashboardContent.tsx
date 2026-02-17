'use client'

import { useDashboardSummary, useTrips } from '@/lib/api'
import {
  tripStatusBadgeClass,
  tripPriorityBadgeClass,
  formatBudget,
  formatTotalBudget,
} from '@/lib/badge-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

function SummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="mt-2 h-8 w-16 rounded bg-border" />
          </CardHeader>
          <CardContent>
            <div className="h-3 w-32 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TripsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-20 rounded bg-border" />
        <div className="mt-1 h-3 w-56 rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 flex-1 rounded bg-muted" />
              <div className="h-5 w-20 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardContent() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary()
  const { data: trips, isLoading: tripsLoading, error: tripsError } = useTrips()

  if (summaryError || tripsError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">
          Failed to load dashboard data. Please try refreshing the page.
        </p>
      </div>
    )
  }

  const summaryCards = summary
    ? [
        {
          title: 'Total Trips',
          value: String(summary.totalTrips),
          description: 'Across all continents',
        },
        {
          title: 'Upcoming',
          value: String(summary.upcomingTrips),
          description: 'Booked or planning',
        },
        {
          title: 'Budget',
          value: formatTotalBudget(summary.totalBudget),
          description: 'Total trip budget',
        },
        {
          title: 'Countries Visited',
          value: String(summary.countriesVisited),
          description: 'Completed trips',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summaryLoading ? (
        <SummaryCardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trips table */}
      {tripsLoading ? (
        <TripsTableSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Trips</CardTitle>
            <CardDescription>Your travel plans at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips?.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.name}</TableCell>
                    <TableCell>{trip.country}</TableCell>
                    <TableCell>
                      <Badge className={tripStatusBadgeClass(trip.status)}>{trip.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={tripPriorityBadgeClass(trip.priority)}>
                        {trip.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatBudget(trip.budget)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
