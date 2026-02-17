/**
 * Responsive card grid displaying all trips.
 *
 * Uses the `useTrips` React Query hook. Shows loading skeletons during
 * fetch and an empty state when no trips exist.
 */

'use client'

import { useTrips } from '@/lib/api'
import { tripStatusBadgeClass, tripPriorityBadgeClass, formatBudget } from '@/lib/badge-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-border" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-5 w-14 rounded-full bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TripsList() {
  const { data: trips, isLoading, error } = useTrips()

  if (isLoading) return <LoadingSkeleton />

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-destructive">
          Failed to load trips. Please try again later.
        </CardContent>
      </Card>
    )
  }

  if (!trips || trips.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No trips found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <Card key={trip.id}>
          <CardHeader>
            <CardTitle className="text-lg">{trip.name}</CardTitle>
            <CardDescription>
              {trip.country} &middot; {trip.continent}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="line-clamp-2 text-sm text-muted-foreground">{trip.description}</p>

            <div className="flex flex-wrap gap-2">
              <Badge className={tripStatusBadgeClass(trip.status)}>{trip.status}</Badge>
              <Badge className={tripPriorityBadgeClass(trip.priority)}>{trip.priority}</Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-semibold text-foreground">{formatBudget(trip.budget)}</span>
            </div>

            {trip.endDate ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dates</span>
                <span className="text-foreground">
                  {trip.startDate} &mdash; {trip.endDate}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Start</span>
                <span className="text-muted-foreground/60">{trip.startDate}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
