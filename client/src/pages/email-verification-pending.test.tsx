/**
 * EmailVerificationPendingPage Tests
 *
 * Covers: page rendering, resend verification, edit-email flow, logout,
 * data-testid presence, and rendering at 375 / 768 / 1280 px viewports.
 *
 * Key note: `apiRequest` throws for non-2xx responses. Error paths land in
 * the catch block which shows "Request failed" — not endpoint-specific titles.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/utils';
import { unauthenticatedMockAuth, unverifiedUserMockAuth } from '@/test/utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import EmailVerificationPendingPage from './email-verification-pending';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

const BREAKPOINTS = [375, 768, 1280];

describe('EmailVerificationPendingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Redirects ─────────────────────────────────────────────────────────────
  describe('redirects', () => {
    it('does not show the page content when user is not logged in', () => {
      render(<EmailVerificationPendingPage />, {
        auth: unauthenticatedMockAuth,
        route: '/email-verification-pending',
      });
      expect(screen.queryByTestId('button-resend-verification')).not.toBeInTheDocument();
    });
  });

  // ── data-testid presence ──────────────────────────────────────────────────
  describe('data-testid attributes', () => {
    it('has data-testid="text-current-email"', () => {
      render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      expect(screen.getByTestId('text-current-email')).toBeInTheDocument();
    });

    it('has data-testid="button-edit-email"', () => {
      render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      expect(screen.getByTestId('button-edit-email')).toBeInTheDocument();
    });

    it('has data-testid="button-resend-verification"', () => {
      render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      expect(screen.getByTestId('button-resend-verification')).toBeInTheDocument();
    });

    it('has data-testid="button-logout"', () => {
      render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      expect(screen.getByTestId('button-logout')).toBeInTheDocument();
    });
  });

  // ── Rendering ─────────────────────────────────────────────────────────────
  describe('renders correctly', () => {
    it('shows the "Verify your email" heading', () => {
      render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });

    it('displays the current user email', () => {
      render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      expect(screen.getByTestId('text-current-email')).toHaveTextContent('test@example.com');
    });
  });

  // ── Resend verification ───────────────────────────────────────────────────
  describe('resend verification', () => {
    it('shows a green success banner after clicking resend', async () => {
      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-resend-verification'));
      await waitFor(() => {
        // The success banner text
        expect(screen.getByText(/verification email sent\. check your inbox\./i)).toBeInTheDocument();
      });
    });

    it('shows a toast after clicking resend successfully', async () => {
      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-resend-verification'));
      await waitFor(() => {
        // Toast title "Email sent" appears in the toast region
        const toastElements = screen.getAllByText(/email sent/i);
        expect(toastElements.length).toBeGreaterThan(0);
      });
    });

    it('shows a "Request failed" toast when resend API returns an error', async () => {
      // apiRequest throws for non-2xx; catch block shows "Request failed"
      server.use(
        http.post('/api/resend-verification', () =>
          new HttpResponse(
            JSON.stringify({ message: 'Rate limit exceeded' }),
            { status: 429 }
          )
        )
      );

      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-resend-verification'));
      await waitFor(() => {
        expect(screen.getByText(/request failed/i)).toBeInTheDocument();
      });
    });
  });

  // ── Edit email flow ───────────────────────────────────────────────────────
  describe('edit email flow', () => {
    it('shows the edit email form after clicking "Edit"', async () => {
      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-edit-email'));
      expect(screen.getByTestId('input-new-email')).toBeInTheDocument();
    });

    it('has data-testid="input-new-email" when editing', async () => {
      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-edit-email'));
      expect(screen.getByTestId('input-new-email')).toBeInTheDocument();
    });

    it('has data-testid="button-update-email" when editing', async () => {
      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-edit-email'));
      expect(screen.getByTestId('button-update-email')).toBeInTheDocument();
    });

    it('shows "Email updated" toast after updating email', async () => {
      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-edit-email'));

      const emailInput = screen.getByTestId('input-new-email');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');
      await user.click(screen.getByTestId('button-update-email'));

      await waitFor(() => {
        expect(screen.getByText(/email updated/i)).toBeInTheDocument();
      });
    });

    it('hides the edit form after successful email update', async () => {
      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-edit-email'));

      const emailInput = screen.getByTestId('input-new-email');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');
      await user.click(screen.getByTestId('button-update-email'));

      await waitFor(() => {
        expect(screen.queryByTestId('input-new-email')).not.toBeInTheDocument();
      });
    });

    it('shows a validation error for invalid email in the edit form', async () => {
      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-edit-email'));

      const emailInput = screen.getByTestId('input-new-email');
      await user.clear(emailInput);
      await user.type(emailInput, 'not-valid');
      // fireEvent.submit bypasses HTML5 email constraint validation; zod runs instead
      fireEvent.submit(emailInput.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('shows a "Request failed" toast when update email API fails', async () => {
      // apiRequest throws for non-2xx; catch block shows "Request failed"
      server.use(
        http.post('/api/update-email', () =>
          new HttpResponse(
            JSON.stringify({ message: 'Email already in use' }),
            { status: 409 }
          )
        )
      );

      const { user } = render(<EmailVerificationPendingPage />, {
        auth: unverifiedUserMockAuth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-edit-email'));

      const emailInput = screen.getByTestId('input-new-email');
      await user.clear(emailInput);
      await user.type(emailInput, 'taken@example.com');
      await user.click(screen.getByTestId('button-update-email'));

      await waitFor(() => {
        expect(screen.getByText(/request failed/i)).toBeInTheDocument();
      });
    });
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('calls logoutMutation.mutate when "Sign out" is clicked', async () => {
      const logoutFn = vi.fn();
      const auth = {
        ...unverifiedUserMockAuth,
        logoutMutation: { isPending: false, mutate: logoutFn, mutateAsync: vi.fn() } as any,
      };

      const { user } = render(<EmailVerificationPendingPage />, {
        auth,
        route: '/email-verification-pending',
      });
      await user.click(screen.getByTestId('button-logout'));
      expect(logoutFn).toHaveBeenCalledOnce();
    });
  });

  // ── Breakpoints ───────────────────────────────────────────────────────────
  describe('renders at all breakpoints', () => {
    BREAKPOINTS.forEach((width) => {
      it(`renders key elements at ${width}px`, () => {
        setViewport(width);
        render(<EmailVerificationPendingPage />, {
          auth: unverifiedUserMockAuth,
          route: '/email-verification-pending',
        });
        expect(screen.getByTestId('text-current-email')).toBeInTheDocument();
        expect(screen.getByTestId('button-resend-verification')).toBeInTheDocument();
        expect(screen.getByTestId('button-edit-email')).toBeInTheDocument();
        expect(screen.getByTestId('button-logout')).toBeInTheDocument();
      });
    });
  });
});
