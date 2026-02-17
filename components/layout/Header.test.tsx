import '@/test/mocks/next'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  }),
}))

vi.mock('@/lib/auth', () => ({
  hasDummyAuth: () => false,
}))

vi.mock('@/lib/env', () => ({
  isSupabaseConfigured: () => false,
}))

describe('Header', () => {
  beforeEach(() => {
    render(<Header />)
  })

  it('renders the app name with a link to home', () => {
    const appName = screen.getByText('App Template')
    expect(appName).toBeInTheDocument()
    expect(appName.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders navigation links with Login when not authenticated', () => {
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Guide')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('renders the theme toggle button', () => {
    const button = screen.getByRole('button', { name: /switch to dark mode/i })
    expect(button).toBeInTheDocument()
  })
})
