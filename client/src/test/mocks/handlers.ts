/**
 * API request handlers for testing
 * Define mock responses for API endpoints
 */

import { http, HttpResponse } from 'msw'
import type { User } from '@shared/schema'
import type { Rfp } from '@shared/schema'; // Added import for Rfp type


export const handlers = [
  // Mock user endpoint
  http.get('/api/user', () => {
    return HttpResponse.json<User>({
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
      companyName: 'Test Company',
      onboardingComplete: false,
      status: 'active',
      cell: null,
      contact: null,
      telephone: null,
      businessEmail: null,
      isMinorityOwned: false,
      minorityGroup: null,
      trade: null,
      certificationName: null,
      logo: null
    })
  }),

  // Mock onboarding endpoint
  http.post('/api/user/onboarding', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>

    // Validate email format
    if (data.businessEmail && typeof data.businessEmail === 'string' && !data.businessEmail.includes('@')) {
      return new HttpResponse(
        JSON.stringify({ message: 'Invalid email format' }), 
        { status: 400 }
      )
    }

    // Mock successful response
    return HttpResponse.json<User>({
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
      companyName: 'Test Company',
      onboardingComplete: true,
      status: 'active',
      cell: data.cell as string | null,
      contact: data.contact as string | null,
      telephone: data.telephone as string | null,
      businessEmail: data.businessEmail as string | null,
      isMinorityOwned: data.isMinorityOwned as boolean,
      minorityGroup: data.minorityGroup as string | null,
      trade: data.trade as string | null,
      certificationName: data.certificationName as string | null,
      logo: data.logo as string | null
    }, { status: 201 })
  }),

  // Mock RFP list endpoint
  http.get('/api/rfps', () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Test RFP',
        description: 'Test Description',
        walkthroughDate: new Date(),
        rfiDate: new Date(),
        deadline: new Date(),
        jobLocation: 'San Francisco, CA',
        featured: true,
        createdAt: new Date(),
        budgetMin: null,
        certificationGoals: null,
        organizationId: 1,
        portfolioLink: null,
        status: 'open',
      },
    ])
  }),

  // Mock RFP creation endpoint
  http.post('/api/rfps', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: 2,
      ...body,
      organizationId: 1,
      status: 'open',
      createdAt: new Date(),
    }, { status: 201 })
  }),
]