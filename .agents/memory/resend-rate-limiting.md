---
name: Resend rate limiting
description: How Resend's per-account throughput ceiling works and how to stay within it safely in sendEmailBatch.
---

## The rule
Resend's activity log records each message in a batch as an individual `POST /emails` entry and applies rate limits **per email**, not per API call. The account-level ceiling is ~10 emails/second. Exceeding it produces 429 responses visible in the Resend dashboard even though the batch API call returned HTTP 200 — these are silent delivery failures from the app's perspective.

## How to apply
- `BATCH_CHUNK_SIZE = 25` — keeps each batch call's email count well within the throughput window.
- `DEFAULT_CHUNK_DELAY_MS = 3_000` — 25 emails / 3 s ≈ 8 emails/s, safely under the ceiling.
- Cron callers use `batchDelayMs = 5_000` (default in `runWeeklyDigest`) for extra headroom.
- Admin digest trigger uses `batchDelayMs = 3_000` — faster than cron but still rate-safe. **Never set to 0 for live sends** — that was the root cause of the June 2026 429 burst.
- `RATE_LIMIT_RECOVERY_MS = 30_000` — when a chunk exhausts all its 429 retries, `sendEmailBatch` waits `max(chunkDelayMs, 30_000)` before the next chunk instead of the normal `chunkDelayMs`. Without this, subsequent chunks immediately 429 too, cascading through the rest of the send.

**Why:** Setting `batchDelayMs: 0` in the admin trigger fired all chunks back-to-back, queuing 100+ emails simultaneously and causing Resend to 429 ~40% of them silently. Even with a reasonable delay, if one chunk rate-limits out after all retries, the next chunk starts immediately after the retry sequence — which can be much shorter than the normal inter-chunk delay — causing a cascade.

## 403 errors in the same context
Resend returns 403 for recipients on their suppression list (hard bounces, spam complaints). These are **permanent** — retrying wastes API calls and contributes to 429s. `isPermanentError()` in `src/lib/email.ts` detects 4xx ≠ 429 errors and prevents the catch block from retrying them.

## Vitest constructor mock pattern
`vi.fn().mockImplementation(() => ...)` uses an arrow function which cannot be used with `new`. Mock Resend like this:
```typescript
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { batch: { send: batchSendMock }, emails: { send: emailsSendMock } };
  }),
}));
```
