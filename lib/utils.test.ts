import { cn } from './utils'

describe('cn()', () => {
  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('handles empty and undefined inputs', () => {
    expect(cn('', undefined, null, 'active')).toBe('active')
  })

  it('returns empty string for no input', () => {
    expect(cn()).toBe('')
  })
})
