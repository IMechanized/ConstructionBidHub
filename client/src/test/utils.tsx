/**
 * Test utilities and helper functions
 * Provides common testing functionality
 */

import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { HelmetProvider } from 'react-helmet-async';
import userEvent from '@testing-library/user-event';
import { Router } from 'wouter';
import { vi } from 'vitest';

// Default mock auth context
const defaultMockAuth = {
  user: {
    id: 1,
    email: 'test@example.com',
    password: 'hashed_password',
    companyName: 'Test Company',
    onboardingComplete: true,
    status: 'active' as const,
    cell: null,
    contact: null,
    telephone: null,
    businessEmail: null,
    isMinorityOwned: false,
    minorityGroup: null,
    trade: null,
    certificationName: null,
    logo: null
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  loginMutation: {
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
    reset: vi.fn(),
    data: null,
  },
  logoutMutation: {
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
    reset: vi.fn(),
    data: null,
  },
  registerMutation: {
    isPending: false,
    isError: false,
    error: null,
    mutate: vi.fn(),
    reset: vi.fn(),
    data: null,
  }
};

// Create a fresh QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Create a custom render function that includes providers
function render(ui: React.ReactElement, { route = '/', queryClient = createTestQueryClient() } = {}) {
  window.history.pushState({}, 'Test page', route);

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { 
      wrapper: ({ children }) => (
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={defaultMockAuth}>
              <Router>
                {children}
                <Toaster />
              </Router>
            </AuthContext.Provider>
          </QueryClientProvider>
        </HelmetProvider>
      )
    }),
  };
}

export * from '@testing-library/react';
export { render };