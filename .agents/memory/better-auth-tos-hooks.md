---
name: better-auth ToS server-side enforcement
description: How to enforce server-side ToS acceptance and server-generated timestamps with better-auth v1.6 additionalFields and databaseHooks
---

## Key lesson: enforce at the actual auth boundary, not only a proxy

The better-auth catch-all `/api/auth/[...all]` route is the only HTTP gatekeeper
for ALL auth traffic. A separate proxy is useful for UX but can be bypassed. Put
enforcement in `[...all]` AND in the proxy (server-side `auth.api.*` calls bypass
the catch-all entirely, so both paths need their own stamp logic).

## Pattern: server-only fields + per-path validation

### Server-generated timestamps (`input: false`)
Mark fields as `input: false` in `additionalFields` so better-auth throws
`FIELD_NOT_ALLOWED` if the client tries to set them:
```ts
tosAcceptedAt: { type: "string", input: false, required: false },
tosVersion:    { type: "string", input: false, required: false },
```
Do NOT use `defaultValue` with a function here — `input: false` stores the raw
function reference, it does NOT call it. Use `databaseHooks` instead.

### Always-run server stamp (`databaseHooks`)
`databaseHooks.user.create.before` runs for ALL user-creation paths (email AND
social OAuth). Return `{ data: { ...user, tosAcceptedAt: new Date(), tosVersion: CURRENT_TOS_VERSION } }`.
This covers social signup which bypasses `parseUserInput` entirely.

### Email-signup enforcement (validation proxy route)
Social OAuth calls `internalAdapter.createUser` directly, skipping
`parseUserInput`, so `required: true` in additionalFields only applies on the
email/password path. For explicit boolean enforcement, use a thin Next.js proxy
route:
- POST `/api/auth/signup-email` validates `body.tosAccepted === true` → 400 if not
- Strips `tosAccepted`, `tosAcceptedAt`, `tosVersion` from the forwarded body
- Calls `auth.api.signUpEmail as unknown as (...) => Promise<Response>` with
  `asResponse: true` and returns the response (preserves session cookies)

**Why:** The `as unknown as` double cast is required — TypeScript rejects a
direct cast from `StrictEndpoint<...>` to a plain function type.

### Test structure
Mock `@/lib/auth` with `signUpEmail: vi.fn()`, then re-import and cast:
```ts
const signUpEmail = vi.mocked(
  auth.api.signUpEmail as unknown as (_: {...}) => Promise<Response>
);
```
Test both `tosAccepted: false` AND `tosAccepted: "true"` (string) → 400, plus
verify the body forwarded to `signUpEmail` never contains `tosAccepted`,
`tosAcceptedAt`, or `tosVersion`.
