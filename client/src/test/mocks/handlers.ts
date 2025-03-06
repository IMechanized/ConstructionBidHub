/**
 * API request handlers for testing
 * Define mock responses for API endpoints
 */

import { http, HttpResponse } from 'msw'
import type { Rfp, User } from '@shared/schema'

export const handlers = [
  // Mock user endpoint
  http.get('/api/user', () => {
    return HttpResponse.json<User>({
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
      companyName: 'Test Company',
      onboardingComplete: true,
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

  // Mock RFP list endpoint
  http.get('/api/rfps', () => {
    return HttpResponse.json<Rfp[]>([
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
    const body = await request.json()
    return HttpResponse.json({
      id: 2,
      ...body,
      organizationId: 1,
      status: 'open',
      createdAt: new Date(),
    }, { status: 201 })
  }),
]