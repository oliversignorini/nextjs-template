import {
  mockTrips,
  mockDestinations,
  mockTripTasks,
  mockDashboardSummary,
} from './mock-data'

describe('mockTrips', () => {
  it('has 8 trips', () => {
    expect(mockTrips).toHaveLength(8)
  })

  it('each trip has required fields', () => {
    for (const trip of mockTrips) {
      expect(trip.id).toBeTruthy()
      expect(trip.name).toBeTruthy()
      expect(trip.status).toBeTruthy()
      expect(trip.priority).toBeTruthy()
      expect(typeof trip.budget).toBe('number')
      expect(trip.country).toBeTruthy()
      expect(trip.continent).toBeTruthy()
    }
  })
})

describe('mockDestinations', () => {
  it('has 10 destinations', () => {
    expect(mockDestinations).toHaveLength(10)
  })

  it('each destination has required fields', () => {
    for (const dest of mockDestinations) {
      expect(dest.id).toBeTruthy()
      expect(dest.name).toBeTruthy()
      expect(dest.country).toBeTruthy()
      expect(dest.type).toBeTruthy()
      expect(dest.bestSeason).toBeTruthy()
      expect(typeof dest.averageDailyCost).toBe('number')
      expect(typeof dest.isVisited).toBe('boolean')
    }
  })
})

describe('mockTripTasks', () => {
  it('has 12 tasks', () => {
    expect(mockTripTasks).toHaveLength(12)
  })

  it('each task has required fields', () => {
    for (const task of mockTripTasks) {
      expect(task.id).toBeTruthy()
      expect(task.title).toBeTruthy()
      expect(task.status).toBeTruthy()
      expect(task.priority).toBeTruthy()
    }
  })

  it('task tripIds reference valid trips', () => {
    const tripIds = new Set(mockTrips.map((t) => t.id))
    for (const task of mockTripTasks) {
      expect(tripIds.has(task.tripId)).toBe(true)
    }
  })
})

describe('mockDashboardSummary', () => {
  it('totalTrips matches mockTrips length', () => {
    expect(mockDashboardSummary.totalTrips).toBe(mockTrips.length)
  })

  it('upcomingTrips matches Booked + Planning count', () => {
    const upcoming = mockTrips.filter(
      (t) => t.status === 'Booked' || t.status === 'Planning',
    ).length
    expect(mockDashboardSummary.upcomingTrips).toBe(upcoming)
  })

  it('totalBudget matches sum of all trip budgets', () => {
    const total = mockTrips.reduce((sum, t) => sum + t.budget, 0)
    expect(mockDashboardSummary.totalBudget).toBe(total)
  })

  it('countriesVisited matches Completed count', () => {
    const completed = mockTrips.filter((t) => t.status === 'Completed').length
    expect(mockDashboardSummary.countriesVisited).toBe(completed)
  })
})
