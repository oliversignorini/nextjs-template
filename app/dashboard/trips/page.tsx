/**
 * Trips page — displays all trips in a responsive card grid.
 *
 * Uses the TripsList client component which fetches data via React Query.
 */

import { TripsList } from '@/components/TripsList'

export default function TripsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Trips</h1>
        <p className="text-sm text-muted-foreground">All your travel plans in one place.</p>
      </div>

      <TripsList />
    </div>
  )
}
