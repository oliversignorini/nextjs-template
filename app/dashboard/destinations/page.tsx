/**
 * Destinations page — displays a destinations table and a trip tasks board.
 *
 * Uses the DestinationsTable and TripTasksBoard client components which
 * fetch data via React Query.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DestinationsTable } from '@/components/DestinationsTable'
import { TripTasksBoard } from '@/components/TripTasksBoard'

export default function DestinationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Destinations</h1>
        <p className="text-sm text-muted-foreground">
          Explore destinations and manage trip tasks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Destinations</CardTitle>
          <CardDescription>Browse and filter destinations around the world.</CardDescription>
        </CardHeader>
        <CardContent>
          <DestinationsTable />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-primary">Trip Tasks</h2>
        <TripTasksBoard />
      </div>
    </div>
  )
}
