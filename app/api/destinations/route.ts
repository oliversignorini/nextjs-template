/**
 * GET /api/destinations
 *
 * Returns destinations with optional type, visited, and continent query-param
 * filtering. Currently serves mock data — swap `mockDestinations` for a
 * database query when ready.
 */

import { NextResponse } from 'next/server'
import { mockDestinations } from '@/lib/mock-data'
import type { Destination, APIResult } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const visited = searchParams.get('visited')
  const continent = searchParams.get('continent')

  let destinations = mockDestinations

  if (type) {
    destinations = destinations.filter((d) => d.type === type)
  }
  if (visited !== null) {
    destinations = destinations.filter((d) => d.isVisited === (visited === 'true'))
  }
  if (continent) {
    destinations = destinations.filter((d) => d.continent === continent)
  }

  const response: APIResult<Destination[]> = {
    success: true,
    data: destinations,
  }

  return NextResponse.json(response)
}
