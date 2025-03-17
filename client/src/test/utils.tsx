/**
 * Test utilities and helper functions
 * Provides common testing functionality
 */

import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { HelmetProvider } from 'react-helmet-async';
import userEvent from '@testing-library/user-event';
import { Form } from '@/components/ui/form';
import { Router } from 'wouter';
import { vi } from 'vitest';

// Create a fresh QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Create a wrapper with all providers needed for testing
function AllTheProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          {children}
          <Toaster />
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

// Create a custom render function that includes providers
function render(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, { wrapper: AllTheProviders }),
  };
}

export * from '@testing-library/react';
export { render };