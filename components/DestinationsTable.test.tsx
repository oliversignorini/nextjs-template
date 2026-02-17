import '@/test/mocks/next'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DestinationsTable } from './DestinationsTable'

describe('DestinationsTable', () => {
  it('shows loading skeleton initially', () => {
    render(<DestinationsTable />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders table headers after loading', async () => {
    render(<DestinationsTable />)

    await waitFor(
      () => {
        expect(screen.getByText('Name')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(screen.getByText('Country')).toBeInTheDocument()
    expect(screen.getByText('Continent')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Best Season')).toBeInTheDocument()
  })

  it('renders all 10 destinations', async () => {
    render(<DestinationsTable />)

    await waitFor(
      () => {
        expect(screen.getByText('Kyoto')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(screen.getByText('Santorini')).toBeInTheDocument()
    expect(screen.getByText('Queenstown')).toBeInTheDocument()
    expect(screen.getByText('Marrakech')).toBeInTheDocument()
    expect(screen.getByText('Reykjavik')).toBeInTheDocument()
    expect(screen.getByText('Bali')).toBeInTheDocument()
    expect(screen.getByText('Banff')).toBeInTheDocument()
    expect(screen.getByText('Lisbon')).toBeInTheDocument()
    expect(screen.getByText('Cusco')).toBeInTheDocument()
    // Fiji appears as both destination name and country, so use getAllByText
    expect(screen.getAllByText('Fiji').length).toBeGreaterThan(0)
  })

  it('shows Visited and Not Yet badges', async () => {
    render(<DestinationsTable />)

    await waitFor(
      () => {
        expect(screen.getAllByText('Visited').length).toBeGreaterThan(0)
      },
      { timeout: 2000 },
    )

    expect(screen.getAllByText('Not Yet').length).toBeGreaterThan(0)
  })

  it('shows type badges', async () => {
    render(<DestinationsTable />)

    await waitFor(
      () => {
        expect(screen.getAllByText('Cultural').length).toBeGreaterThan(0)
      },
      { timeout: 2000 },
    )

    expect(screen.getAllByText('Adventure').length).toBeGreaterThan(0)
  })

  it('filters destinations by search text', async () => {
    const user = userEvent.setup()
    render(<DestinationsTable />)

    await waitFor(
      () => {
        expect(screen.getByText('Kyoto')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    const searchInput = screen.getByPlaceholderText('Search by name or country...')
    await user.type(searchInput, 'kyoto')

    expect(screen.getByText('Kyoto')).toBeInTheDocument()
    expect(screen.queryByText('Santorini')).not.toBeInTheDocument()
  })

  it('filters destinations by type', async () => {
    const user = userEvent.setup()
    render(<DestinationsTable />)

    await waitFor(
      () => {
        expect(screen.getByText('Kyoto')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    const typeSelect = screen.getByDisplayValue('All Types')
    await user.selectOptions(typeSelect, 'Beach')

    expect(screen.getByText('Bali')).toBeInTheDocument()
    expect(screen.queryByText('Kyoto')).not.toBeInTheDocument()
  })

  it('shows empty state when no destinations match filters', async () => {
    const user = userEvent.setup()
    render(<DestinationsTable />)

    await waitFor(
      () => {
        expect(screen.getByText('Kyoto')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    const searchInput = screen.getByPlaceholderText('Search by name or country...')
    await user.type(searchInput, 'zzzznonexistent')

    expect(screen.getByText('No matching destinations found.')).toBeInTheDocument()
  })

  it('sorts destinations by name when clicking column header', async () => {
    const user = userEvent.setup()
    render(<DestinationsTable />)

    await waitFor(
      () => {
        expect(screen.getByText('Kyoto')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    // Click Name header to sort ascending
    await user.click(screen.getByText('Name'))

    const rows = screen.getAllByRole('row')
    // First data row (after header) should be alphabetically first
    const firstDataRow = rows[1]
    expect(firstDataRow).toHaveTextContent('Bali')
  })
})
