/**
 * Test setup configuration
 * This file runs before all tests to set up the testing environment
 */

import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Mock react-i18next so components that call i18n.changeLanguage don't crash
// in jsdom (where i18next is not initialized).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      language: 'en',
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Start MSW server
// WebSocket connections (e.g. hot-reload, notifications) are allowed to pass
// through unhandled so that component tests that open WS connections don't fail.
beforeAll(() =>
  server.listen({
    onUnhandledRequest: (request, print) => {
      if (
        request.url.startsWith('ws://') ||
        request.url.startsWith('wss://')
      ) {
        return; // silently ignore WebSocket upgrade requests
      }
      print.error();
    },
  })
)

// Reset handlers after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Clean up
afterAll(() => server.close())