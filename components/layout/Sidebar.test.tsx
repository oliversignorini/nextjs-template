import { setMockPathname } from '@/test/mocks/next'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'
import { useAppStore } from '@/lib/store'

describe('Sidebar', () => {
  beforeEach(() => {
    setMockPathname('/dashboard')
    useAppStore.setState({ sidebarCollapsed: false })
  })

  it('renders all navigation items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Trips')).toBeInTheDocument()
    expect(screen.getByText('Destinations')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('has a collapse/expand toggle button', () => {
    render(<Sidebar />)
    const button = screen.getByRole('button', { name: /collapse sidebar/i })
    expect(button).toBeInTheDocument()
  })

  it('hides labels when collapsed', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const button = screen.getByRole('button', { name: /collapse sidebar/i })
    await user.click(button)

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Trips')).not.toBeInTheDocument()
  })

  it('shows expand button when collapsed', async () => {
    useAppStore.setState({ sidebarCollapsed: true })
    render(<Sidebar />)

    const button = screen.getByRole('button', { name: /expand sidebar/i })
    expect(button).toBeInTheDocument()
  })

  it('highlights the active route', () => {
    setMockPathname('/dashboard/trips')
    render(<Sidebar />)

    const tripsLink = screen.getByRole('link', { name: /trips/i })
    expect(tripsLink.className).toContain('bg-primary')
  })
})
