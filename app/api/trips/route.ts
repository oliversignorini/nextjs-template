/**
 * GET /api/trips
 *
 * Returns trips with optional status, priority, and continent query-param
 * filtering. Currently serves mock data — swap `mockTrips` for a database
 * query when ready.
 */

import { NextResponse } from 'next/server'
import { mockTrips } from '@/lib/mock-data'
import type { Trip, APIResult } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const continent = searchParams.get('continent')

  let trips = mockTrips

  if (status) {
    trips = trips.filter((t) => t.status === status)
  }
  if (priority) {
    trips = trips.filter((t) => t.priority === priority)
  }
  if (continent) {
    trips = trips.filter((t) => t.continent === continent)
  }

  const response: APIResult<Trip[]> = {
    success: true,
    data: trips,
  }

  return NextResponse.json(response)
}
