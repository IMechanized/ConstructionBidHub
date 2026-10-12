/**
 * ForgotPasswordPage Tests
 *
 * Covers: form rendering, data-testid presence, successful submission (success
 * state), API error handling, and rendering at 375 / 768 / 1280 px viewports.
 *
 * Note: `apiRequest` throws for any non-2xx response (via throwIfResNotOk),
 * so error paths in pages land in the catch block showing "Request failed".
 * Tests reflect the actual runtime behaviour.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/utils';
import { unauthenticatedMockAuth } from '@/test/utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import ForgotPasswordPage from './forgot-password-page';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

const BREAKPOINTS = [375, 768, 1280];

describe('ForgotPasswordPage', () => {
  // ── data-testid presence ─────────────────────────────────────────────────
  describe('data-testid attributes', () => {
    it('has data-testid="input-email"', () => {
      render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
    });

    it('has data-testid="button-send-reset"', () => {
      render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      expect(screen.getByTestId('button-send-reset')).toBeInTheDocument();
    });

    it('has data-testid="button-back-login"', () => {
      render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      expect(screen.getByTestId('button-back-login')).toBeInTheDocument();
    });
  });

  // ── Rendering ────────────────────────────────────────────────────────────
  describe('renders correctly', () => {
    it('shows the reset-password heading', () => {
      render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    });

    it('shows the email input and send button', () => {
      render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByTestId('button-send-reset')).toBeInTheDocument();
    });
  });

  // ── Successful submission ─────────────────────────────────────────────────
  describe('successful submission', () => {
    it('shows the "Check your inbox" success state after valid submission', async () => {
      const { user } = render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      await user.type(screen.getByTestId('input-email'), 'user@example.com');
      await user.click(screen.getByTestId('button-send-reset'));

      await waitFor(() => {
        expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
      });
    });

    it('hides the form after successful submission', async () => {
      const { user } = render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      await user.type(screen.getByTestId('input-email'), 'user@example.com');
      await user.click(screen.getByTestId('button-send-reset'));

      await waitFor(() => {
        expect(screen.queryByTestId('input-email')).not.toBeInTheDocument();
      });
    });

    it('"Back to login" button is still visible after success', async () => {
      const { user } = render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      await user.type(screen.getByTestId('input-email'), 'user@example.com');
      await user.click(screen.getByTestId('button-send-reset'));

      await waitFor(() => {
        expect(screen.getByTestId('button-back-login')).toBeInTheDocument();
      });
    });
  });

  // ── Validation ───────────────────────────────────────────────────────────
  describe('validation', () => {
    it('shows validation error when email is empty on submit', async () => {
      // Use fireEvent.submit to bypass native browser validation on type="email"
      render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      const form = screen.getByTestId('input-email').closest('form')!;
      fireEvent.submit(form);
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('shows validation error when email format is invalid', async () => {
      // fireEvent.submit bypasses HTML5 constraint validation; zod runs instead
      const { user } = render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      await user.type(screen.getByTestId('input-email'), 'not-an-email');
      const form = screen.getByTestId('input-email').closest('form')!;
      fireEvent.submit(form);
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });
  });

  // ── API error handling ────────────────────────────────────────────────────
  describe('API error handling', () => {
    it('shows a "Request failed" toast when the API returns a server error', async () => {
      // apiRequest throws for non-2xx; the page catch block shows "Request failed"
      server.use(
        http.post('/api/request-password-reset', () =>
          new HttpResponse(
            JSON.stringify({ message: 'Server error, please try again.' }),
            { status: 500 }
          )
        )
      );

      const { user } = render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      await user.type(screen.getByTestId('input-email'), 'user@example.com');
      await user.click(screen.getByTestId('button-send-reset'));

      await waitFor(() => {
        expect(screen.getByText(/request failed/i)).toBeInTheDocument();
      });
    });

    it('stays on the form (no success state) when the API errors', async () => {
      server.use(
        http.post('/api/request-password-reset', () =>
          new HttpResponse(JSON.stringify({ message: 'Error' }), { status: 500 })
        )
      );

      const { user } = render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
      await user.type(screen.getByTestId('input-email'), 'user@example.com');
      await user.click(screen.getByTestId('button-send-reset'));

      await waitFor(() => {
        expect(screen.getByTestId('input-email')).toBeInTheDocument();
      });
    });
  });

  // ── Breakpoints ──────────────────────────────────────────────────────────
  describe('renders at all breakpoints', () => {
    BREAKPOINTS.forEach((width) => {
      it(`renders correctly at ${width}px`, () => {
        setViewport(width);
        render(<ForgotPasswordPage />, { auth: unauthenticatedMockAuth });
        expect(screen.getByTestId('input-email')).toBeInTheDocument();
        expect(screen.getByTestId('button-send-reset')).toBeInTheDocument();
        expect(screen.getByTestId('button-back-login')).toBeInTheDocument();
      });
    });
  });
});
