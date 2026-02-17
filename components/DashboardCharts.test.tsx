import '@/test/mocks/next'
import { render, screen, waitFor } from '@/test/test-utils'
import { DashboardCharts } from './DashboardCharts'

// Mock recharts ResponsiveContainer which needs a real DOM size
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 300 }}>{children}</div>
    ),
  }
})

describe('DashboardCharts', () => {
  it('shows loading skeleton initially', () => {
    render(<DashboardCharts />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders chart cards after loading', async () => {
    render(<DashboardCharts />)

    await waitFor(
      () => {
        expect(screen.getByText('Budget by Continent')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(screen.getByText('Trips by Status')).toBeInTheDocument()
    expect(screen.getByText('Total trip budget per continent.')).toBeInTheDocument()
    expect(screen.getByText('Distribution of trips across statuses.')).toBeInTheDocument()
  })
})
