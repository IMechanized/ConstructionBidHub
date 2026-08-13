/**
 * ResetPasswordPage Tests
 *
 * Covers: loading / invalid / valid / success states, data-testid presence,
 * form submission, password mismatch validation, and rendering at 375 / 768 /
 * 1280 px viewports.
 *
 * Key note: `apiRequest` throws for non-2xx responses, so the catch block
 * is what runs on token-verification or reset failures. The toast title
 * in those cases is "Verification error" / "Reset error".
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/utils';
import { unauthenticatedMockAuth } from '@/test/utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import ResetPasswordPage from './reset-password-page';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

const BREAKPOINTS = [375, 768, 1280];

// Helper: render at a URL that includes a reset token
function renderWithToken(token: string) {
  return render(<ResetPasswordPage />, {
    auth: unauthenticatedMockAuth,
    route: `/reset-password?token=${token}`,
  });
}

describe('ResetPasswordPage', () => {
  // ── No token (invalid state) ──────────────────────────────────────────────
  describe('no token in URL', () => {
    it('shows the "Invalid reset link" state immediately', async () => {
      render(<ResetPasswordPage />, { auth: unauthenticatedMockAuth, route: '/reset-password' });
      await waitFor(() => {
        expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
      });
    });

    it('offers a "Request new link" button', async () => {
      render(<ResetPasswordPage />, { auth: unauthenticatedMockAuth, route: '/reset-password' });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /request new link/i })).toBeInTheDocument();
      });
    });
  });

  // ── Invalid token ─────────────────────────────────────────────────────────
  describe('invalid token in URL', () => {
    it('shows the "Invalid reset link" state after token verification fails', async () => {
      // "bad-token" returns 400 → apiRequest throws → catch → setStatus("invalid")
      renderWithToken('bad-token');
      await waitFor(() => {
        expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
      });
    });
  });

  // ── Valid token ───────────────────────────────────────────────────────────
  describe('valid token in URL', () => {
    it('shows the "Set new password" heading after token is verified', async () => {
      renderWithToken('valid-token');
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
      });
    });

    it('has data-testid="input-password"', async () => {
      renderWithToken('valid-token');
      await waitFor(() => {
        expect(screen.getByTestId('input-password')).toBeInTheDocument();
      });
    });

    it('has data-testid="input-confirm-password"', async () => {
      renderWithToken('valid-token');
      await waitFor(() => {
        expect(screen.getByTestId('input-confirm-password')).toBeInTheDocument();
      });
    });

    it('has data-testid="button-reset-password"', async () => {
      renderWithToken('valid-token');
      await waitFor(() => {
        expect(screen.getByTestId('button-reset-password')).toBeInTheDocument();
      });
    });

    // ── Validation ──────────────────────────────────────────────────────────
    it('shows an error when passwords do not match', async () => {
      const { user } = renderWithToken('valid-token');
      await waitFor(() => screen.getByTestId('input-password'));

      await user.type(screen.getByTestId('input-password'), 'Password123');
      await user.type(screen.getByTestId('input-confirm-password'), 'Different456');
      // Use fireEvent.submit to bypass any native input constraints
      fireEvent.submit(screen.getByTestId('input-password').closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('shows an error when password is too short', async () => {
      const { user } = renderWithToken('valid-token');
      await waitFor(() => screen.getByTestId('input-password'));

      await user.type(screen.getByTestId('input-password'), 'short');
      await user.type(screen.getByTestId('input-confirm-password'), 'short');
      fireEvent.submit(screen.getByTestId('input-password').closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    // ── Successful submission ────────────────────────────────────────────────
    it('shows the "Password updated" success state after submit', async () => {
      const { user } = renderWithToken('valid-token');
      await waitFor(() => screen.getByTestId('input-password'));

      await user.type(screen.getByTestId('input-password'), 'NewPassword1');
      await user.type(screen.getByTestId('input-confirm-password'), 'NewPassword1');
      await user.click(screen.getByTestId('button-reset-password'));

      await waitFor(() => {
        expect(screen.getByText(/password updated/i)).toBeInTheDocument();
      });
    });

    it('shows data-testid="button-back-login" in the success state', async () => {
      const { user } = renderWithToken('valid-token');
      await waitFor(() => screen.getByTestId('input-password'));

      await user.type(screen.getByTestId('input-password'), 'NewPassword1');
      await user.type(screen.getByTestId('input-confirm-password'), 'NewPassword1');
      await user.click(screen.getByTestId('button-reset-password'));

      await waitFor(() => {
        expect(screen.getByTestId('button-back-login')).toBeInTheDocument();
      });
    });

    // ── API error on submit ──────────────────────────────────────────────────
    it('shows a "Reset error" toast when the reset API returns an error', async () => {
      // apiRequest throws for non-2xx; catch block shows "Reset error"
      server.use(
        http.post('/api/reset-password', () =>
          new HttpResponse(
            JSON.stringify({ message: 'Token has expired' }),
            { status: 400 }
          )
        )
      );

      const { user } = renderWithToken('valid-token');
      await waitFor(() => screen.getByTestId('input-password'));

      await user.type(screen.getByTestId('input-password'), 'NewPassword1');
      await user.type(screen.getByTestId('input-confirm-password'), 'NewPassword1');
      await user.click(screen.getByTestId('button-reset-password'));

      await waitFor(() => {
        expect(screen.getByText(/reset error/i)).toBeInTheDocument();
      });
    });
  });

  // ── Breakpoints ───────────────────────────────────────────────────────────
  describe('renders at all breakpoints', () => {
    BREAKPOINTS.forEach((width) => {
      it(`renders the invalid state at ${width}px (no token)`, async () => {
        setViewport(width);
        render(<ResetPasswordPage />, { auth: unauthenticatedMockAuth, route: '/reset-password' });
        await waitFor(() => {
          expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
        });
      });

      it(`renders the password form at ${width}px (valid token)`, async () => {
        setViewport(width);
        renderWithToken('valid-token');
        await waitFor(() => {
          expect(screen.getByTestId('input-password')).toBeInTheDocument();
          expect(screen.getByTestId('button-reset-password')).toBeInTheDocument();
        });
      });
    });
  });
});
