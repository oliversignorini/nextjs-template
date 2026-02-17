import '@/test/mocks/next'
import { render, screen, waitFor } from '@/test/test-utils'
import { TripsList } from './TripsList'

describe('TripsList', () => {
  it('shows loading skeleton initially', () => {
    render(<TripsList />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders trip cards after loading', async () => {
    render(<TripsList />)

    await waitFor(
      () => {
        expect(screen.getByText('Tokyo & Kyoto Explorer')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(screen.getByText('Greek Island Hopping')).toBeInTheDocument()
    expect(screen.getByText('Patagonia Trek')).toBeInTheDocument()
  })

  it('displays status badges', async () => {
    render(<TripsList />)

    await waitFor(
      () => {
        expect(screen.getAllByText('Booked').length).toBeGreaterThan(0)
      },
      { timeout: 2000 },
    )

    expect(screen.getAllByText('Planning').length).toBeGreaterThan(0)
  })

  it('displays priority badges', async () => {
    render(<TripsList />)

    await waitFor(
      () => {
        expect(screen.getAllByText('Bucket List').length).toBeGreaterThan(0)
      },
      { timeout: 2000 },
    )

    expect(screen.getAllByText('High').length).toBeGreaterThan(0)
  })

  it('displays formatted budgets', async () => {
    render(<TripsList />)

    await waitFor(
      () => {
        expect(screen.getByText('$0')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })
})
