---
name: Logger migration
description: All console.* calls replaced with structured logger; OWASP tests updated accordingly
---

## Rule
Use `logger` from `@/lib/logger` everywhere — never `console.log/warn/error` in application code.

## Why
Step 12 of engineering audit. Structured logger emits JSON in production (NODE_ENV=production), plain text in dev. Makes log aggregation and alerting reliable.

## How to apply
- `import { logger } from "@/lib/logger"`
- Replace: `console.error("msg", val)` → `logger.error("msg", { context: "module-name", error: String(val) })`
- Always include `context` field so logs are filterable by module
- OWASP logging tests (`src/security/__tests__/owasp-logging.test.ts`) check for `logger.error` (not `console.error`) — keep in sync
- Files completed: stripe/webhook, stripe/success, paypal/success, paypal/topup-success, paypal/campaign-topup-success, paypal/campaign-fund-success, stripe-stuck-detector, social-revalidation-scheduler, paypal-reconcile, notifications, wallet, payments/paypal, payments/stripe, payments/campaign-receipt
