---
name: Cost-guardrail stacking
description: Per-resource freshness cool-downs alone are not sufficient rate limits for paid external API calls
---

## Rule
When throttling calls to a paid external API (e.g. Apify, any per-call-billed service) triggered by a manual/on-demand user action, do not rely solely on a per-resource freshness cool-down (skip re-fetching if fetched within N hours). Add a *separate*, independent rate limit keyed on the action/actor (e.g. per profile, per user) that is checked and consumed before per-resource eligibility is computed.

**Why:** A freshness cool-down only activates once a resource has a successful fetch timestamp. A resource that has never been fetched, or that fails every attempt (so it never records `lastFetchedAt`), stays permanently "eligible" and can be manually re-triggered as fast as the user can click, fully bypassing the cool-down and racking up billed calls.

**How to apply:** Stack two guardrails: (1) an independent rate limiter (e.g. max N attempts per window per resource/profile id) checked immediately after loading the target resource, before filtering which sub-items are eligible; (2) the per-item freshness cool-down applied afterward, to skip re-billing items that already have fresh data. Write tests that specifically exercise a never-fetched or always-failing item to prove the rate limiter — not just the cool-down — blocks repeated attempts.
