/**
 * React Query hooks for data fetching.
 *
 * Each hook currently returns mock data with a simulated network delay.
 * To switch to real API calls, uncomment the fetch-based `queryFn` and
 * remove the mock implementation.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { mockTrips, mockDestinations, mockTripTasks, mockDashboardSummary } from '@/lib/mock-data'
import type { Trip, Destination, TripTask, DashboardSummary } from '@/types'

/** Simulate network latency for realistic loading states */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

/**
 * Fetches all trips. Returns mock data with a 500ms simulated delay.
 */
export function useTrips() {
  return useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      await delay(500)
      return mockTrips

      // Real API swap:
      // const res = await fetch('/api/trips')
      // const json = await res.json()
      // if (!json.success) throw new Error(json.error.message)
      // return json.data
    },
  })
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

interface UseDestinationsParams {
  type?: string
  visited?: boolean
  continent?: string
}

/**
 * Fetches destinations with optional type, visited, and continent filters.
 */
export function useDestinations(params?: UseDestinationsParams) {
  return useQuery<Destination[]>({
    queryKey: ['destinations', params],
    queryFn: async () => {
      await delay(400)
      let destinations = mockDestinations

      if (params?.type) {
        destinations = destinations.filter((d) => d.type === params.type)
      }
      if (params?.visited !== undefined) {
        destinations = destinations.filter((d) => d.isVisited === params.visited)
      }
      if (params?.continent) {
        destinations = destinations.filter((d) => d.continent === params.continent)
      }

      return destinations

      // Real API swap:
      // const searchParams = new URLSearchParams()
      // if (params?.type) searchParams.set('type', params.type)
      // if (params?.visited !== undefined) searchParams.set('visited', String(params.visited))
      // if (params?.continent) searchParams.set('continent', params.continent)
      // const res = await fetch(`/api/destinations?${searchParams}`)
      // const json = await res.json()
      // if (!json.success) throw new Error(json.error.message)
      // return json.data
    },
  })
}

// ---------------------------------------------------------------------------
// Trip Tasks
// ---------------------------------------------------------------------------

/**
 * Fetches trip tasks, optionally filtered by trip ID.
 */
export function useTripTasks(tripId?: string) {
  return useQuery<TripTask[]>({
    queryKey: ['tripTasks', tripId],
    queryFn: async () => {
      await delay(300)
      let tasks = mockTripTasks

      if (tripId) {
        tasks = tasks.filter((t) => t.tripId === tripId)
      }

      return tasks

      // Real API swap:
      // const searchParams = new URLSearchParams()
      // if (tripId) searchParams.set('tripId', tripId)
      // const res = await fetch(`/api/tasks?${searchParams}`)
      // const json = await res.json()
      // if (!json.success) throw new Error(json.error.message)
      // return json.data
    },
  })
}

// ---------------------------------------------------------------------------
// Dashboard Summary
// ---------------------------------------------------------------------------

/**
 * Fetches the dashboard summary.
 */
export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      await delay(400)
      return mockDashboardSummary

      // Real API swap:
      // const res = await fetch('/api/dashboard/summary')
      // const json = await res.json()
      // if (!json.success) throw new Error(json.error.message)
      // return json.data
    },
  })
}
