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
import type { User } from '@shared/schema';

// ── Canonical mock user — matches schema $inferSelect exactly ─────────────
const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  password: 'hashed_password',
  companyName: 'Test Company',
  companyWebsite: null,
  firstName: null,
  lastName: null,
  jobTitle: null,
  telephone: null,
  cell: null,
  isMinorityOwned: false,
  minorityGroup: null,
  trade: null,
  certificationName: null,
  logo: null,
  onboardingComplete: true,
  status: 'active',
  language: 'en',
  emailVerified: true,
  verificationToken: null,
  verificationTokenExpiry: null,
  resetToken: null,
  resetTokenExpiry: null,
  failedLoginAttempts: 0,
  accountLockedUntil: null,
  isAdmin: false,
};

// ── Auth context mocks ────────────────────────────────────────────────────

/** Authenticated, email-verified, onboarding-complete user */
export const defaultMockAuth = {
  user: mockUser,
  isLoading: false,
  error: null,
  loginMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
  logoutMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
  registerMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
};

/** Not logged in */
export const unauthenticatedMockAuth = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
  logoutMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
  registerMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
};

/** Logged in but email not yet verified */
export const unverifiedUserMockAuth = {
  user: { ...mockUser, emailVerified: false, onboardingComplete: false },
  isLoading: false,
  error: null,
  loginMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
  logoutMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
  registerMutation: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() } as any,
};

// ── QueryClient factory ───────────────────────────────────────────────────

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

// ── render — wraps with providers; injects mocked AuthContext ─────────────

function render(
  ui: React.ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    auth = defaultMockAuth as any,
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, {
      wrapper: ({ children }) => (
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={auth}>
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
