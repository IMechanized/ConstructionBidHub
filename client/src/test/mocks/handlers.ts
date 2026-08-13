/**
 * API request handlers for testing
 * Define mock responses for API endpoints
 */

import { http, HttpResponse } from 'msw'
import type { User, Rfp, Rfi } from '@shared/schema'

// ── Canonical mock fixtures ───────────────────────────────────────────────
// These match the schema's $inferSelect shapes exactly.

export const mockUser: User = {
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
}

export const mockUnverifiedUser: User = {
  ...mockUser,
  emailVerified: false,
  onboardingComplete: false,
}

const mockRfp: Rfp = {
  id: 1,
  clientName: null,
  title: 'Test RFP',
  slug: null,
  description: 'Test Description',
  walkthroughDate: new Date(),
  rfiDate: new Date(),
  deadline: new Date(),
  budgetMin: null,
  certificationGoals: null,
  desiredTrades: null,
  jobStreet: null,
  jobCity: 'San Francisco',
  jobState: 'CA',
  jobZip: null,
  portfolioLink: null,
  mandatoryWalkthrough: false,
  status: 'open',
  organizationId: 1,
  featured: true,
  featuredAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ── Handlers ──────────────────────────────────────────────────────────────

export const handlers = [
  // Current user — 401 when unauthenticated; override per-test for authenticated state
  http.get('/api/user', () => {
    return new HttpResponse(null, { status: 401 })
  }),

  // Auth: login
  http.post('/api/login', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>
    if (data.email === 'wrong@example.com' || data.password === 'wrongpassword') {
      return new HttpResponse(
        JSON.stringify({ message: 'Invalid email or password' }),
        { status: 401 }
      )
    }
    return HttpResponse.json<User>(mockUser)
  }),

  // Auth: register
  http.post('/api/register', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>
    return HttpResponse.json<User>({
      ...mockUnverifiedUser,
      email: data.email as string,
      companyName: data.companyName as string,
      companyWebsite: (data.companyWebsite as string) || null,
    }, { status: 201 })
  }),

  // Auth: logout
  http.post('/api/logout', () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // Password reset: request
  http.post('/api/request-password-reset', async () => {
    return new HttpResponse(
      JSON.stringify({ message: 'Password reset email sent' }),
      { status: 200 }
    )
  }),

  // Password reset: verify token
  http.get('/api/verify-reset-token', ({ request }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    if (token === 'valid-token') {
      return HttpResponse.json({ valid: true })
    }
    return new HttpResponse(
      JSON.stringify({ message: 'Invalid or expired token' }),
      { status: 400 }
    )
  }),

  // Password reset: submit new password
  http.post('/api/reset-password', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>
    if (data.token === 'valid-token') {
      return HttpResponse.json({ message: 'Password reset successfully' })
    }
    return new HttpResponse(
      JSON.stringify({ message: 'Invalid or expired token' }),
      { status: 400 }
    )
  }),

  // Email verification: verify token
  http.get('/api/verify-email', ({ request }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    if (token === 'valid-token') {
      return HttpResponse.json({
        message: 'Email verified successfully!',
        isAuthenticated: true,
        user: { ...mockUser, emailVerified: true },
      })
    }
    return new HttpResponse(
      JSON.stringify({ message: 'Invalid or expired verification token' }),
      { status: 400 }
    )
  }),

  // Email verification: resend
  http.post('/api/resend-verification', () => {
    return HttpResponse.json({ message: 'Verification email sent' })
  }),

  // Email verification: update email
  http.post('/api/update-email', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>
    return HttpResponse.json({ message: 'Email updated', email: data.email })
  }),

  // Onboarding
  http.post('/api/user/onboarding', async () => {
    return HttpResponse.json<User>({
      ...mockUser,
      onboardingComplete: true,
    }, { status: 201 })
  }),

  // RFP list
  http.get('/api/rfps', () => {
    return HttpResponse.json<Rfp[]>([mockRfp])
  }),

  // RFP error case (kept for compatibility)
  http.get('/api/rfps/error', () => {
    return new HttpResponse(
      JSON.stringify({ message: 'Failed to fetch RFPs' }),
      { status: 500 }
    )
  }),

  // RFP creation
  http.post('/api/rfps', async ({ request }) => {
    const body = await request.json() as Partial<Rfp>
    return HttpResponse.json<Rfp>({
      ...mockRfp,
      id: 2,
      ...body,
      updatedAt: new Date(),
    } as Rfp, { status: 201 })
  }),

  // RFI list
  http.get('/api/rfis', () => {
    const mockDate = new Date()
    return HttpResponse.json<(Rfi & { rfp: Rfp })[]>([
      {
        id: 1,
        rfpId: 1,
        email: 'requester@example.com',
        message: 'Test RFI message',
        status: 'pending',
        createdAt: mockDate,
        rfp: { ...mockRfp, createdAt: mockDate, updatedAt: mockDate },
      }
    ])
  }),

  // RFI error case
  http.get('/api/rfis/error', () => {
    return new HttpResponse(
      JSON.stringify({ message: 'Failed to fetch RFIs' }),
      { status: 500 }
    )
  }),
]
