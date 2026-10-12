---
name: "use server" export restriction
description: Next.js server-action files can only export async functions; move sync helpers elsewhere
---

## Rule
A file with a top-level `"use server"` directive may only export async functions (server actions). It cannot also export plain synchronous helpers, constants meant for import elsewhere, or test-only reset/utility functions.

**Why:** Next.js enforces this because everything exported from a `"use server"` file is treated as a callable server action reference bundled for the client. Adding a sync export (e.g. a rate-limit checker, a module-level cache reset hook for tests) causes a build-time error or silently breaks the action boundary.

**How to apply:** When a server action needs shared sync logic (rate limiters, in-memory caches, pure helpers) — especially anything a test needs to reset or call directly — put that logic in a plain module (no `"use server"`) and `import` it into the action file. Only the actual action function(s) should live in the `"use server"` file.
