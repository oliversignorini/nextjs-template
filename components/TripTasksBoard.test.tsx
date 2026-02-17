import '@/test/mocks/next'
import { render, screen, waitFor } from '@/test/test-utils'
import { TripTasksBoard } from './TripTasksBoard'

describe('TripTasksBoard', () => {
  it('shows loading skeleton initially', () => {
    render(<TripTasksBoard />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders column headers after loading', async () => {
    render(<TripTasksBoard />)

    await waitFor(
      () => {
        expect(screen.getByText('To Research')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(screen.getByText('Booking')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('renders task cards', async () => {
    render(<TripTasksBoard />)

    await waitFor(
      () => {
        expect(
          screen.getByText('Research visa requirements for Japan'),
        ).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(screen.getByText('Book Tokyo to Kyoto bullet train tickets')).toBeInTheDocument()
    expect(screen.getByText('Confirm Tokyo hotel reservation')).toBeInTheDocument()
    expect(screen.getByText('Pack for NYC trip')).toBeInTheDocument()
  })

  it('displays priority badges on task cards', async () => {
    render(<TripTasksBoard />)

    await waitFor(
      () => {
        expect(screen.getAllByText('High').length).toBeGreaterThan(0)
      },
      { timeout: 2000 },
    )

    expect(screen.getAllByText('Medium').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bucket List').length).toBeGreaterThan(0)
  })
})
