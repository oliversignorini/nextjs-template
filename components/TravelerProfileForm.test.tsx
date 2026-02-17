import '@/test/mocks/next'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { TravelerProfileForm } from './TravelerProfileForm'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('TravelerProfileForm', () => {
  it('renders all form fields', () => {
    render(<TravelerProfileForm />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Travel Style')).toBeInTheDocument()
    expect(screen.getByLabelText('Preferred Currency')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Receive travel deals and destination inspiration emails'),
    ).toBeInTheDocument()
  })

  it('pre-fills with default traveler data', () => {
    render(<TravelerProfileForm />)

    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe')
    expect(screen.getByLabelText('Email')).toHaveValue('jane.doe@example.com')
    expect(screen.getByLabelText('Travel Style')).toHaveValue('Mid-range')
    expect(screen.getByLabelText('Preferred Currency')).toHaveValue('AUD')
  })

  it('shows validation errors when fields are cleared and submitted', async () => {
    const user = userEvent.setup()
    render(<TravelerProfileForm />)

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)

    const emailInput = screen.getByLabelText('Email')
    await user.clear(emailInput)

    await user.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
    })
  })

  it('calls toast.success on valid submit', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    render(<TravelerProfileForm />)

    await user.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Profile saved successfully', {
        description: 'Updated profile for Jane Doe',
      })
    })
  })

  it('resets form to defaults', async () => {
    const user = userEvent.setup()
    render(<TravelerProfileForm />)

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Changed Name')

    expect(nameInput).toHaveValue('Changed Name')

    await user.click(screen.getByText('Reset'))

    await waitFor(() => {
      expect(nameInput).toHaveValue('Jane Doe')
    })
  })
})
