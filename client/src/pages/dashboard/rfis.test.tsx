import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RfiPage from './rfis'
import { Router } from 'wouter'
import { AuthProvider } from '@/hooks/use-auth'

// Create a fresh QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Mock auth context with default authenticated state
const mockAuthContext = {
  user: {
    id: 1,
    email: 'test@example.com',
    companyName: 'Test Company',
    onboardingComplete: true,
  },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
}

describe('RfiPage', () => {
  it('shows loading state initially', () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={mockAuthContext}>
          <Router>
            <RfiPage />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    )

    expect(screen.getByRole('heading', { name: /request for information/i })).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-section-skeleton')).toBeInTheDocument()
  })

  it('displays RFIs when data is loaded', async () => {
    const queryClient = createTestQueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={mockAuthContext}>
          <Router>
            <RfiPage />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Wait for the RFI data to load
    await waitFor(() => {
      expect(screen.getByText('Test RFP')).toBeInTheDocument()
    })

    // Check if RFI details are displayed
    expect(screen.getByText('Test RFI message')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('handles error state appropriately', async () => {
    const queryClient = createTestQueryClient()
    // Force the query to error
    queryClient.setQueryDefaults(['/api/rfis'], {
      queryFn: () => Promise.reject('Error fetching RFIs'),
    })

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={mockAuthContext}>
          <Router>
            <RfiPage />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Verify error handling UI
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-section-skeleton')).not.toBeInTheDocument()
      expect(screen.getByText(/error loading rfis/i)).toBeInTheDocument()
    })
  })
})