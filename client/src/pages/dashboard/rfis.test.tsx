import { render, screen, waitFor } from '@/test/utils'
import RfiPage from './rfis'
import { QueryClient } from '@tanstack/react-query'
import { vi } from 'vitest'

describe('RfiPage', () => {
  it('shows loading state initially', () => {
    render(<RfiPage />)

    expect(screen.getByRole('heading', { name: /request for information/i })).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-section-skeleton')).toBeInTheDocument()
  })

  it('displays RFIs when data is loaded', async () => {
    render(<RfiPage />)

    // Wait for the RFI data to load
    await waitFor(() => {
      expect(screen.getByText('Test RFP')).toBeInTheDocument()
    })

    // Check if RFI details are displayed
    expect(screen.getByText('Test RFI message')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('handles error state appropriately', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: () => Promise.reject('Error fetching RFIs'),
        },
      },
    })

    render(<RfiPage />, { queryClient })

    // Verify error handling UI
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-section-skeleton')).not.toBeInTheDocument()
      expect(screen.getByText(/error loading rfis/i)).toBeInTheDocument()
    })
  })
})