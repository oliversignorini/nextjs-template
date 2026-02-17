import '@/test/mocks/next'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  beforeEach(() => {
    render(<Footer />)
  })

  it('renders the app name', () => {
    const appName = screen.getAllByText('App Template')
    expect(appName.length).toBeGreaterThan(0)
  })

  it('renders Guide and Dashboard links', () => {
    expect(screen.getByText('Guide')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    const year = new Date().getFullYear()
    const copyright = screen.getByText(new RegExp(`${year}`))
    expect(copyright).toBeInTheDocument()
  })
})
