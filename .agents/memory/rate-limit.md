---
name: Rate limiter pattern
description: In-memory sliding-window rate limiter implementation and test patterns
---

## Rule
`src/lib/rate-limit.ts` implements an IP-based sliding-window limiter. The `store` Map is module-level and persists for the process lifetime.

## Why
Applied to POST /api/auth/[...all] to block brute-force login attempts (10 req / 15 min per IP). No Redis dependency required for this scale.

## How to apply
- Import `checkRateLimit` from `@/lib/rate-limit`
- Call at the top of POST handlers; return the 429 response if non-null
- In tests, use `vi.useFakeTimers()` + `vi.advanceTimersByTime()` to simulate window expiry
- Different IPs get independent counters — use distinct IP strings per test case to avoid cross-test bleed
