import {
  tripStatusBadgeClass,
  tripPriorityBadgeClass,
  destinationTypeBadgeClass,
  formatBudget,
  formatTotalBudget,
  getAssigneeName,
} from './badge-utils'

describe('tripStatusBadgeClass()', () => {
  it('returns classes for Dreaming', () => {
    expect(tripStatusBadgeClass('Dreaming')).toContain('brand-400')
  })

  it('returns classes for Planning', () => {
    expect(tripStatusBadgeClass('Planning')).toContain('amber-100')
  })

  it('returns classes for Booked', () => {
    expect(tripStatusBadgeClass('Booked')).toContain('emerald-100')
  })

  it('returns classes for Completed', () => {
    expect(tripStatusBadgeClass('Completed')).toContain('brand-grey-300')
  })

  it('returns classes for Cancelled', () => {
    expect(tripStatusBadgeClass('Cancelled')).toContain('destructive')
  })
})

describe('tripPriorityBadgeClass()', () => {
  it('returns classes for Bucket List', () => {
    expect(tripPriorityBadgeClass('Bucket List')).toContain('purple')
  })

  it('returns classes for High', () => {
    expect(tripPriorityBadgeClass('High')).toContain('destructive')
  })

  it('returns classes for Medium', () => {
    expect(tripPriorityBadgeClass('Medium')).toContain('amber-600')
  })

  it('returns classes for Low', () => {
    expect(tripPriorityBadgeClass('Low')).toContain('brand-grey-300')
  })
})

describe('destinationTypeBadgeClass()', () => {
  it('returns classes for City', () => {
    expect(destinationTypeBadgeClass('City')).toContain('brand-400')
  })

  it('returns classes for Beach', () => {
    expect(destinationTypeBadgeClass('Beach')).toContain('cyan')
  })

  it('returns classes for Mountain', () => {
    expect(destinationTypeBadgeClass('Mountain')).toContain('emerald')
  })

  it('returns classes for Cultural', () => {
    expect(destinationTypeBadgeClass('Cultural')).toContain('purple')
  })

  it('returns classes for Adventure', () => {
    expect(destinationTypeBadgeClass('Adventure')).toContain('amber')
  })

  it('returns classes for Island', () => {
    expect(destinationTypeBadgeClass('Island')).toContain('brand-500')
  })

  it('returns classes for Countryside', () => {
    expect(destinationTypeBadgeClass('Countryside')).toContain('lime')
  })
})

describe('formatBudget()', () => {
  it('formats zero as "$0"', () => {
    expect(formatBudget(0)).toBe('$0')
  })

  it('formats thousands with AUD currency', () => {
    const result = formatBudget(5500)
    expect(result).toContain('5')
    expect(result).toContain('$')
  })

  it('formats small amounts', () => {
    const result = formatBudget(100)
    expect(result).toContain('$')
    expect(result).toContain('100')
  })
})

describe('formatTotalBudget()', () => {
  it('formats millions with M suffix', () => {
    expect(formatTotalBudget(5_000_000)).toBe('$5.0M')
  })

  it('formats 1 million', () => {
    expect(formatTotalBudget(1_000_000)).toBe('$1.0M')
  })

  it('formats 2.1 million', () => {
    expect(formatTotalBudget(2_100_000)).toBe('$2.1M')
  })

  it('falls back to formatBudget for amounts under 1M', () => {
    const result = formatTotalBudget(500_000)
    expect(result).toContain('$')
    expect(result).toContain('500')
  })

  it('formats zero', () => {
    expect(formatTotalBudget(0)).toBe('$0')
  })
})

describe('getAssigneeName()', () => {
  it('returns null for null assignee', () => {
    expect(getAssigneeName(null)).toBeNull()
  })

  it('returns the assignee name as-is', () => {
    expect(getAssigneeName('Emily Chen')).toBe('Emily Chen')
  })
})
