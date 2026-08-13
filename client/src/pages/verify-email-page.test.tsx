/**
 * VerifyEmailPage Tests
 *
 * Covers: loading state, success state, error state, data-testid presence,
 * and rendering at 375 / 768 / 1280 px viewports.
 *
 * Key note: `apiRequest` throws for non-2xx responses. For invalid tokens
 * the catch block runs and the generic error message is shown:
 * "An error occurred during email verification. Please try again later."
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { unauthenticatedMockAuth, defaultMockAuth } from '@/test/utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import VerifyEmailPage from './verify-email-page';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

const BREAKPOINTS = [375, 768, 1280];

describe('VerifyEmailPage', () => {
  // ── No token in URL ───────────────────────────────────────────────────────
  describe('no token in URL', () => {
    it('does not show verification content and navigates away when there is no token', async () => {
      render(<VerifyEmailPage />, {
        auth: unauthenticatedMockAuth,
        route: '/verify-email',
      });
      // The page calls navigate("/auth") immediately when token is absent.
      // None of the verification states (loading/success/error) should render
      // after the effect fires; the URL should have changed to /auth.
      await waitFor(() => {
        expect(window.location.pathname).toBe('/auth');
      });
      // The verify-email page content (buttons) should not be present
      expect(screen.queryByTestId('button-continue')).not.toBeInTheDocument();
    });
  });

  // ── Invalid token ─────────────────────────────────────────────────────────
  describe('invalid token in URL', () => {
    it('shows the "Verification failed" heading after API reports bad token', async () => {
      // bad-token → API returns 400 → apiRequest throws → catch sets error state
      render(<VerifyEmailPage />, {
        auth: unauthenticatedMockAuth,
        route: '/verify-email?token=bad-token',
      });
      await waitFor(() => {
        expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      });
    });

    it('has data-testid="button-continue" in the error state', async () => {
      render(<VerifyEmailPage />, {
        auth: unauthenticatedMockAuth,
        route: '/verify-email?token=bad-token',
      });
      await waitFor(() => {
        expect(screen.getByTestId('button-continue')).toBeInTheDocument();
      });
    });

    it('shows the generic error message when the token is invalid', async () => {
      // apiRequest throws for 400, so the catch message is shown
      render(<VerifyEmailPage />, {
        auth: unauthenticatedMockAuth,
        route: '/verify-email?token=bad-token',
      });
      await waitFor(() => {
        expect(
          screen.getByText(/an error occurred during email verification/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ── Valid token (success) ─────────────────────────────────────────────────
  describe('valid token in URL', () => {
    it('shows the success state after API confirms verification', async () => {
      render(<VerifyEmailPage />, {
        auth: unauthenticatedMockAuth,
        route: '/verify-email?token=valid-token',
      });
      await waitFor(() => {
        expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument();
      });
    });

    it('has data-testid="button-continue" in the success state', async () => {
      render(<VerifyEmailPage />, {
        auth: unauthenticatedMockAuth,
        route: '/verify-email?token=valid-token',
      });
      await waitFor(() => {
        expect(screen.getByTestId('button-continue')).toBeInTheDocument();
      });
    });

    it('shows "Go to Dashboard" when user has completed onboarding', async () => {
      render(<VerifyEmailPage />, {
        auth: defaultMockAuth,
        route: '/verify-email?token=valid-token',
      });
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /go to dashboard/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ── Network error during verification ────────────────────────────────────
  describe('network error during verification', () => {
    it('shows the error state when the API call fails', async () => {
      server.use(
        http.get('/api/verify-email', () => HttpResponse.error())
      );

      render(<VerifyEmailPage />, {
        auth: unauthenticatedMockAuth,
        route: '/verify-email?token=valid-token',
      });
      await waitFor(() => {
        expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      });
    });
  });

  // ── Breakpoints ───────────────────────────────────────────────────────────
  describe('renders at all breakpoints', () => {
    BREAKPOINTS.forEach((width) => {
      it(`renders the success state at ${width}px`, async () => {
        setViewport(width);
        render(<VerifyEmailPage />, {
          auth: unauthenticatedMockAuth,
          route: '/verify-email?token=valid-token',
        });
        await waitFor(() => {
          expect(screen.getByTestId('button-continue')).toBeInTheDocument();
        });
      });
    });
  });
});
