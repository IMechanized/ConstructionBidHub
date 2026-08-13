/**
 * AuthPage Tests
 *
 * Covers: login tab, register tab, form fields, form submission,
 * data-testid presence, and rendering at 375 / 768 / 1280 px viewports.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test/utils';
import { unauthenticatedMockAuth } from '@/test/utils';
import AuthPage from './auth-page';

// Helper to set a fake viewport width
function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

const BREAKPOINTS = [375, 768, 1280];

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────────────────────
  describe('renders correctly', () => {
    it('shows the login tab by default', () => {
      render(<AuthPage />, { auth: unauthenticatedMockAuth });
      expect(screen.getByRole('tab', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /register/i })).toBeInTheDocument();
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('shows email and password fields in the login tab', () => {
      render(<AuthPage />, { auth: unauthenticatedMockAuth });
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows a "Forgot password?" link in the login tab', () => {
      render(<AuthPage />, { auth: unauthenticatedMockAuth });
      expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
    });
  });

  // ── Register tab ─────────────────────────────────────────────────────────
  describe('register tab', () => {
    it('switches to register tab and shows the registration form', async () => {
      const { user } = render(<AuthPage />, { auth: unauthenticatedMockAuth });
      await user.click(screen.getByRole('tab', { name: /register/i }));
      expect(screen.getByText(/create an account/i)).toBeInTheDocument();
    });

    it('register tab contains data-testid="input-company-name"', async () => {
      const { user } = render(<AuthPage />, { auth: unauthenticatedMockAuth });
      await user.click(screen.getByRole('tab', { name: /register/i }));
      expect(screen.getByTestId('input-company-name')).toBeInTheDocument();
    });

    it('register tab contains data-testid="input-company-website"', async () => {
      const { user } = render(<AuthPage />, { auth: unauthenticatedMockAuth });
      await user.click(screen.getByRole('tab', { name: /register/i }));
      expect(screen.getByTestId('input-company-website')).toBeInTheDocument();
    });

    it('register tab shows email, password, and submit button', async () => {
      const { user } = render(<AuthPage />, { auth: unauthenticatedMockAuth });
      await user.click(screen.getByRole('tab', { name: /register/i }));
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });

  // ── Login form submission ────────────────────────────────────────────────
  describe('login form submission', () => {
    it('calls loginMutation.mutate when credentials are submitted', async () => {
      const mutateFn = vi.fn();
      const auth = {
        ...unauthenticatedMockAuth,
        loginMutation: { isPending: false, mutate: mutateFn, mutateAsync: vi.fn() } as any,
      };

      const { user } = render(<AuthPage />, { auth });
      await user.type(screen.getByLabelText(/^email$/i), 'user@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledTimes(1);
      });
      expect(mutateFn.mock.calls[0][0]).toMatchObject({
        email: 'user@example.com',
        password: 'password123',
      });
    });

    it('shows validation error when email is invalid', async () => {
      const { user } = render(<AuthPage />, { auth: unauthenticatedMockAuth });
      // Type a clearly-invalid email with no @ then submit
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });
  });

  // ── Register form submission ─────────────────────────────────────────────
  describe('register form submission', () => {
    it('calls registerMutation.mutate when registration form is submitted', async () => {
      const mutateFn = vi.fn();
      const auth = {
        ...unauthenticatedMockAuth,
        registerMutation: { isPending: false, mutate: mutateFn, mutateAsync: vi.fn() } as any,
      };

      const { user } = render(<AuthPage />, { auth });
      await user.click(screen.getByRole('tab', { name: /register/i }));
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corp');
      await user.type(screen.getByLabelText(/^email$/i), 'admin@acme.com');
      // Password must satisfy securePasswordSchema: ≥8 chars, letter, number, special char
      await user.type(screen.getByLabelText(/^password$/i), 'Secure@123');
      // fireEvent.submit bypasses native browser constraint validation on type="email"
      // so zod + react-hook-form are the only validation layer used
      fireEvent.submit(screen.getByTestId('input-company-name').closest('form')!);

      await waitFor(() => {
        expect(mutateFn).toHaveBeenCalledTimes(1);
      });
      expect(mutateFn.mock.calls[0][0]).toMatchObject({
        companyName: 'Acme Corp',
        email: 'admin@acme.com',
        password: 'Secure@123',
      });
    });
  });

  // ── Breakpoints ──────────────────────────────────────────────────────────
  describe('renders at all breakpoints', () => {
    BREAKPOINTS.forEach((width) => {
      it(`renders the login tab correctly at ${width}px`, () => {
        setViewport(width);
        render(<AuthPage />, { auth: unauthenticatedMockAuth });
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      });
    });
  });
});
