/**
 * Test setup configuration
 * This file runs before all tests to set up the testing environment
 */

import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

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

// Define interfaces for Touch events
interface TouchInit {
  identifier: number;
  target: EventTarget;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  pageX: number;
  pageY: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
  force: number;
}

interface TouchEventInit extends EventInit {
  touches?: Touch[];
  targetTouches?: Touch[];
  changedTouches?: Touch[];
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  view?: Window | null;
  detail?: number;
}

// Mock Touch class
class TouchMock implements Touch {
  readonly identifier: number;
  readonly target: EventTarget;
  readonly clientX: number;
  readonly clientY: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly rotationAngle: number;
  readonly force: number;

  constructor(init: TouchInit) {
    this.identifier = init.identifier;
    this.target = init.target;
    this.clientX = init.clientX;
    this.clientY = init.clientY;
    this.screenX = init.screenX;
    this.screenY = init.screenY;
    this.pageX = init.pageX;
    this.pageY = init.pageY;
    this.radiusX = init.radiusX;
    this.radiusY = init.radiusY;
    this.rotationAngle = init.rotationAngle;
    this.force = init.force;
  }
}

// Mock TouchEvent class
class TouchEventMock extends Event implements TouchEvent {
  readonly touches: TouchList;
  readonly targetTouches: TouchList;
  readonly changedTouches: TouchList;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly view: Window | null;
  readonly detail: number;

  constructor(type: string, init: TouchEventInit = {}) {
    super(type, init);

    this.touches = init.touches 
      ? (Object.assign([], init.touches, { item: (i: number) => init.touches![i] })) as TouchList
      : ([] as unknown as TouchList);

    this.targetTouches = init.targetTouches 
      ? (Object.assign([], init.targetTouches, { item: (i: number) => init.targetTouches![i] })) as TouchList
      : ([] as unknown as TouchList);

    this.changedTouches = init.changedTouches 
      ? (Object.assign([], init.changedTouches, { item: (i: number) => init.changedTouches![i] })) as TouchList
      : ([] as unknown as TouchList);

    this.ctrlKey = init.ctrlKey || false;
    this.shiftKey = init.shiftKey || false;
    this.altKey = init.altKey || false;
    this.metaKey = init.metaKey || false;
    this.view = init.view || null;
    this.detail = init.detail || 0;
  }
}

// Assign mock constructors to global
global.Touch = TouchMock as unknown as typeof Touch;
global.TouchEvent = TouchEventMock as unknown as typeof TouchEvent;

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Clean up
afterAll(() => server.close())