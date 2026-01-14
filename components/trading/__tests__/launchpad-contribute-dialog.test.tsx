import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LaunchpadContributeDialog } from '../launchpad-contribute-dialog'

global.fetch = jest.fn()

describe('LaunchpadContributeDialog', () => {
  const mockProps = {
    projectId: 'test-project-1',
    projectName: 'Test Project',
    pricePerToken: '2.0',
    minContribution: '100',
    maxContribution: '10000',
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dialog with project information', () => {
    render(<LaunchpadContributeDialog {...mockProps} />)

    expect(screen.getByText('Contribute to Test Project')).toBeInTheDocument()
    expect(screen.getByText(/Your contribution will be private/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Min: 100, Max: 10000/i)).toBeInTheDocument()
    expect(screen.getByText('Range: $100 - $10000')).toBeInTheDocument()
  })

  it('should calculate tokens to receive correctly', () => {
    render(<LaunchpadContributeDialog {...mockProps} />)

    const input = screen.getByPlaceholderText(/Min: 100/i)
    fireEvent.change(input, { target: { value: '1000' } })

    expect(screen.getByText(/500\.00 tokens/i)).toBeInTheDocument()
  })

  it('should allow selecting between USDT and USDC', () => {
    render(<LaunchpadContributeDialog {...mockProps} />)

    const usdtRadio = screen.getByLabelText('USDT') as HTMLInputElement
    const usdcRadio = screen.getByLabelText('USDC') as HTMLInputElement

    expect(usdtRadio.checked).toBe(true)
    expect(usdcRadio.checked).toBe(false)

    fireEvent.click(usdcRadio)

    expect(usdtRadio.checked).toBe(false)
    expect(usdcRadio.checked).toBe(true)
  })

  it('should show error for amount below minimum', async () => {
    render(<LaunchpadContributeDialog {...mockProps} />)

    const input = screen.getByPlaceholderText(/Min: 100/i)
    const submitButton = screen.getByRole('button', { name: /contribute/i })

    fireEvent.change(input, { target: { value: '50' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Amount must be between/i)).toBeInTheDocument()
    })
  })

  it('should show error for amount above maximum', async () => {
    render(<LaunchpadContributeDialog {...mockProps} />)

    const input = screen.getByPlaceholderText(/Min: 100/i)
    const submitButton = screen.getByRole('button', { name: /contribute/i })

    fireEvent.change(input, { target: { value: '20000' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Amount must be between/i)).toBeInTheDocument()
    })
  })

  it('should call onClose when cancel button is clicked', () => {
    render(<LaunchpadContributeDialog {...mockProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('should call onClose when X button is clicked', () => {
    render(<LaunchpadContributeDialog {...mockProps} />)

    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)

    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('should submit contribution successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, shieldTxHash: '0xtxhash' }),
    })

    render(<LaunchpadContributeDialog {...mockProps} />)

    const input = screen.getByPlaceholderText(/Min: 100/i)
    const submitButton = screen.getByRole('button', { name: /contribute/i })

    fireEvent.change(input, { target: { value: '1000' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/launchpad/contribute',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('1000'),
        })
      )
    })

    expect(mockProps.onSuccess).toHaveBeenCalled()
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Contribution failed' }),
    })

    render(<LaunchpadContributeDialog {...mockProps} />)

    const input = screen.getByPlaceholderText(/Min: 100/i)
    const submitButton = screen.getByRole('button', { name: /contribute/i })

    fireEvent.change(input, { target: { value: '1000' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Contribution failed')).toBeInTheDocument()
    })

    expect(mockProps.onSuccess).not.toHaveBeenCalled()
    expect(mockProps.onClose).not.toHaveBeenCalled()
  })
})
