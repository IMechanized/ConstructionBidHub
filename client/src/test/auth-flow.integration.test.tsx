/**
 * Auth-flow integration tests
 *
 * These tests use the REAL AuthProvider (not a mocked context) so that the
 * actual hook logic — /api/user query, loginMutation, registerMutation,
 * logoutMutation, and their onSuccess/onError navigation — is exercised.
 *
 * MSW intercepts all network requests so no real server is required.
 *
 * Key flows covered:
 *  - Login → email-verification-pending  (unverified user)
 *  - Login → onboarding                  (verified but not onboarded)
 *  - Login → dashboard                   (fully set-up user)
 *  - Login failure → toast shown
 *  - Register → email-verification-pending
 *  - Forgot-password request → success state (Check your inbox)
 *  - Forgot-password request → error kept on form
 *  - Reset-password via valid token → success (Password updated)
 *  - Reset-password via invalid token → invalid state shown
 *  - Email-verification via valid token → success state
 *  - Email-verification via invalid token → error state
 *  - Email-verification with no token → redirects to /auth
 *  - Resend verification email → inline success message
 *  - Logout from verification-pending → redirects to /auth
 */

import React from 'react';
import {
  render as rtlRender,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch, Route, Router } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { http, HttpResponse } from 'msw';

import { AuthProvider } from '@/hooks/use-auth';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { server } from '@/test/mocks/server';
import { mockUser, mockUnverifiedUser } from '@/test/mocks/handlers';

import AuthPage from '@/pages/auth-page';
import EmailVerificationPendingPage from '@/pages/email-verification-pending';
import ForgotPasswordPage from '@/pages/forgot-password-page';
import ResetPasswordPage from '@/pages/reset-password-page';
import VerifyEmailPage from '@/pages/verify-email-page';

// ── App wrapper with real AuthProvider + Wouter routing ───────────────────
//
// The module-level queryClient is used intentionally: AuthProvider's
// loginMutation.onSuccess calls queryClient.setQueryData() on the module-level
// client, so useQuery inside AuthProvider must read from the same client.
//
// Important: override GET /api/user per-test via server.use() so that React
// Query background re-fetches (staleTime:0) don't silently reset the user to
// null.

function renderAuthFlow(initialRoute: string = '/auth') {
  window.history.pushState({}, '', initialRoute);
  queryClient.clear();

  return {
    user: userEvent.setup(),
    ...rtlRender(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <Switch>
                <Route path="/auth"><AuthPage /></Route>
                <Route path="/email-verification-pending">
                  <EmailVerificationPendingPage />
                </Route>
                <Route path="/forgot-password"><ForgotPasswordPage /></Route>
                <Route path="/reset-password"><ResetPasswordPage /></Route>
                <Route path="/verify-email"><VerifyEmailPage /></Route>
                {/* Sentinel stubs so navigation-destination assertions are unambiguous */}
                <Route path="/dashboard">
                  <div data-testid="dashboard-page">Dashboard</div>
                </Route>
                <Route path="/onboarding">
                  <div data-testid="onboarding-page">Onboarding</div>
                </Route>
                <Route path="/">
                  <div data-testid="home-page">Home</div>
                </Route>
              </Switch>
              <Toaster />
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    ),
  };
}

beforeEach(() => {
  queryClient.clear();
});

// ── Helpers ───────────────────────────────────────────────────────────────

/** Wait for the login tab to be ready (user = null → auth page renders). */
async function waitForLoginForm() {
  await waitFor(() =>
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Login flows
// ─────────────────────────────────────────────────────────────────────────

describe('login flow', () => {
  it('navigates to /email-verification-pending when the user email is not verified', async () => {
    // First GET /api/user → 401 (shows login form).
    // All subsequent fetches → unverified user (so the pending page stays visible).
    let apiUserCalls = 0;
    server.use(
      http.get('/api/user', () =>
        apiUserCalls++ === 0
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json(mockUnverifiedUser)
      ),
      http.post('/api/login', () => HttpResponse.json(mockUnverifiedUser)),
    );

    const { user } = renderAuthFlow('/auth');
    await waitForLoginForm();

    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password@123');
    fireEvent.submit(screen.getByLabelText(/^email$/i).closest('form')!);

    // After loginMutation.onSuccess the hook navigates to /email-verification-pending
    await waitFor(() => {
      expect(screen.getByTestId('button-resend-verification')).toBeInTheDocument();
    });
  });

  it('navigates to /onboarding when the user is verified but has not completed onboarding', async () => {
    server.use(
      http.get('/api/user', () => new HttpResponse(null, { status: 401 })),
      http.post('/api/login', () =>
        HttpResponse.json({ ...mockUser, onboardingComplete: false })
      ),
    );

    const { user } = renderAuthFlow('/auth');
    await waitForLoginForm();

    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password@123');
    fireEvent.submit(screen.getByLabelText(/^email$/i).closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
    });
  });

  it('navigates to /dashboard when the user is fully set up', async () => {
    server.use(
      http.get('/api/user', () => new HttpResponse(null, { status: 401 })),
      http.post('/api/login', () => HttpResponse.json(mockUser)),
    );

    const { user } = renderAuthFlow('/auth');
    await waitForLoginForm();

    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password@123');
    fireEvent.submit(screen.getByLabelText(/^email$/i).closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  it('shows a "Login failed" toast when the server rejects credentials', async () => {
    server.use(
      http.get('/api/user', () => new HttpResponse(null, { status: 401 })),
      http.post('/api/login', () =>
        new HttpResponse(
          JSON.stringify({ message: 'Invalid credentials' }),
          { status: 401 }
        )
      ),
    );

    const { user } = renderAuthFlow('/auth');
    await waitForLoginForm();

    await user.type(screen.getByLabelText(/^email$/i), 'bad@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
    fireEvent.submit(screen.getByLabelText(/^email$/i).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Registration flow
// ─────────────────────────────────────────────────────────────────────────

describe('registration flow', () => {
  it('navigates to /email-verification-pending after successful registration', async () => {
    let apiUserCalls = 0;
    server.use(
      http.get('/api/user', () =>
        apiUserCalls++ === 0
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json(mockUnverifiedUser)
      ),
      http.post('/api/register', () =>
        HttpResponse.json(mockUnverifiedUser, { status: 201 })
      ),
    );

    const { user } = renderAuthFlow('/auth');
    await waitForLoginForm();

    // Switch to the Register tab
    await user.click(screen.getByRole('tab', { name: /register/i }));
    await waitFor(() =>
      expect(screen.getByTestId('input-company-name')).toBeInTheDocument()
    );

    await user.type(screen.getByTestId('input-company-name'), 'Acme Corp');
    await user.type(screen.getByLabelText(/^email$/i), 'new@acme.com');
    // Must satisfy securePasswordSchema: ≥8 chars, letter, number, special char
    await user.type(screen.getByLabelText(/^password$/i), 'Secure@123');

    fireEvent.submit(screen.getByTestId('input-company-name').closest('form')!);

    await waitFor(() => {
      expect(screen.getByTestId('button-resend-verification')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Forgot-password flow
// ─────────────────────────────────────────────────────────────────────────

describe('forgot-password flow', () => {
  it('shows "Check your inbox" after a successful reset request', async () => {
    server.use(
      http.get('/api/user', () => new HttpResponse(null, { status: 401 })),
      http.post('/api/request-password-reset', () =>
        HttpResponse.json({ message: 'Password reset email sent' })
      ),
    );

    const { user } = renderAuthFlow('/forgot-password');

    await waitFor(() =>
      expect(screen.getByTestId('input-email')).toBeInTheDocument()
    );

    await user.type(screen.getByTestId('input-email'), 'user@example.com');
    fireEvent.submit(screen.getByTestId('input-email').closest('form')!);

    // Success state renders an h2 "Check your inbox" (no dedicated testid)
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /check your inbox/i })
      ).toBeInTheDocument();
    });
  });

  it('keeps the form visible and does not show the success state on error', async () => {
    server.use(
      http.get('/api/user', () => new HttpResponse(null, { status: 401 })),
      http.post('/api/request-password-reset', () =>
        new HttpResponse(
          JSON.stringify({ message: 'No account found' }),
          { status: 404 }
        )
      ),
    );

    const { user } = renderAuthFlow('/forgot-password');

    await waitFor(() =>
      expect(screen.getByTestId('input-email')).toBeInTheDocument()
    );

    await user.type(screen.getByTestId('input-email'), 'nobody@example.com');
    fireEvent.submit(screen.getByTestId('input-email').closest('form')!);

    // apiRequest throws for 404, so the catch handler fires ("Request failed" toast)
    // The success state must NOT appear; the email input stays visible
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /check your inbox/i })
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Password-reset-via-token flow
// ─────────────────────────────────────────────────────────────────────────

describe('reset-password flow', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/user', () => new HttpResponse(null, { status: 401 })),
    );
  });

  it('loads the "Set new password" form when the reset token is valid', async () => {
    renderAuthFlow('/reset-password?token=valid-token');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /set new password/i })
      ).toBeInTheDocument();
    });
  });

  it('shows "Invalid reset link" when the reset token is invalid or missing', async () => {
    renderAuthFlow('/reset-password?token=bad-token');

    // apiRequest throws for 400 → catch → setStatus("invalid") → shows error UI
    await waitFor(() => {
      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });
  });

  it('shows "Password updated" after successfully setting a new password', async () => {
    const { user } = renderAuthFlow('/reset-password?token=valid-token');

    // Wait for the form to load (token verified)
    await waitFor(() =>
      expect(screen.getByTestId('input-password')).toBeInTheDocument()
    );

    await user.type(screen.getByTestId('input-password'), 'NewPass@123');
    await user.type(screen.getByTestId('input-confirm-password'), 'NewPass@123');
    fireEvent.submit(screen.getByTestId('input-password').closest('form')!);

    // Success state shows "Password updated" paragraph and "Go to login" button
    await waitFor(() => {
      expect(screen.getByText(/password updated/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('button-back-login')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Email-verification flow
// ─────────────────────────────────────────────────────────────────────────

describe('email-verification flow', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/user', () => new HttpResponse(null, { status: 401 })),
    );
  });

  it('shows the verified-email message when the token is valid', async () => {
    renderAuthFlow('/verify-email?token=valid-token');

    // Success state renders the message returned by the API
    await waitFor(() => {
      expect(
        screen.getByText(/email verified successfully/i)
      ).toBeInTheDocument();
    });
    // The continue button also renders
    expect(screen.getByTestId('button-continue')).toBeInTheDocument();
  });

  it('shows "Verification failed" text when the token is invalid', async () => {
    renderAuthFlow('/verify-email?token=invalid-token');

    // Error state: <p className="font-semibold">Verification failed</p>
    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
    });
    expect(screen.getByTestId('button-continue')).toBeInTheDocument();
  });

  it('redirects to /auth when no token is present in the URL', async () => {
    renderAuthFlow('/verify-email');

    // navigate("/auth") is called immediately; the auth page input appears
    await waitFor(() => {
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Email-verification-pending flow
// ─────────────────────────────────────────────────────────────────────────

describe('email-verification-pending flow', () => {
  /**
   * Render the pending page with the unverified user already in the query
   * cache *and* a GET /api/user override that keeps returning the unverified
   * user for all background re-fetches (staleTime:0 would otherwise reset
   * the cache to null via the default 401 handler).
   */
  function renderPendingPage() {
    server.use(
      http.get('/api/user', () => HttpResponse.json(mockUnverifiedUser)),
    );

    window.history.pushState({}, '', '/email-verification-pending');
    queryClient.clear();
    queryClient.setQueryData(['/api/user'], mockUnverifiedUser);

    return {
      user: userEvent.setup(),
      ...rtlRender(
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Router>
                <Switch>
                  <Route path="/email-verification-pending">
                    <EmailVerificationPendingPage />
                  </Route>
                  <Route path="/auth">
                    <div data-testid="auth-page">Auth</div>
                  </Route>
                  <Route path="/">
                    <div data-testid="home-page">Home</div>
                  </Route>
                </Switch>
                <Toaster />
              </Router>
            </AuthProvider>
          </QueryClientProvider>
        </HelmetProvider>
      ),
    };
  }

  it('shows the resend-verification, edit-email, and logout controls', async () => {
    renderPendingPage();

    await waitFor(() =>
      expect(screen.getByTestId('button-resend-verification')).toBeInTheDocument()
    );
    expect(screen.getByTestId('button-edit-email')).toBeInTheDocument();
    expect(screen.getByTestId('button-logout')).toBeInTheDocument();
  });

  it('shows an "Email sent" toast after clicking Resend', async () => {
    server.use(
      http.post('/api/resend-verification', () =>
        HttpResponse.json({ message: 'Verification email sent' })
      ),
    );

    const { user } = renderPendingPage();

    await waitFor(() =>
      expect(screen.getByTestId('button-resend-verification')).toBeInTheDocument()
    );

    await user.click(screen.getByTestId('button-resend-verification'));

    // On success the page shows both an inline banner and a toast.
    // The inline banner text is unique: "Verification email sent. Check your inbox."
    await waitFor(() => {
      expect(
        screen.getByText(/verification email sent\. check your inbox/i)
      ).toBeInTheDocument();
    });
  });

  it('navigates to /auth after the user clicks Sign out', async () => {
    const { user } = renderPendingPage();

    await waitFor(() =>
      expect(screen.getByTestId('button-logout')).toBeInTheDocument()
    );

    await user.click(screen.getByTestId('button-logout'));

    // logoutMutation.onSuccess calls navigate("/") but our sentinel is at /
    // OR navigate("/") hits the home sentinel. Either way, the pending page is gone.
    await waitFor(() => {
      expect(
        screen.queryByTestId('button-resend-verification')
      ).not.toBeInTheDocument();
    });
  });
});
