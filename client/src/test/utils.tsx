/**
 * Test utilities and helper functions
 * Provides common testing functionality
 */

import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import userEvent from '@testing-library/user-event';

// Create a custom render function that includes providers
function render(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    user: userEvent.setup(),
    ...rtlRender(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {ui}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    ),
  };
}

export * from '@testing-library/react';
export { render };