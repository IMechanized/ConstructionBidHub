---
name: Neon DB driver setup
description: Correct drizzle-orm adapter for @neondatabase/serverless Pool; mismatched adapter causes idle-connection crashes.
---

## The rule
`src/lib/db/index.ts` uses `Pool` from `@neondatabase/serverless`. The correct drizzle adapter is `drizzle-orm/neon-serverless`. Do NOT use `drizzle-orm/node-postgres` — that adapter expects a standard `pg.Pool` and is incompatible with Neon's serverless pool.

## Why
The `node-postgres` adapter + Neon serverless pool mismatch caused Neon's idle-connection timeout (~5 min of inactivity) to terminate the connection server-side. The next DB query threw "Connection terminated unexpectedly", crashing any request that hit the DB after an idle period. `drizzle-orm/neon-serverless` uses WebSocket transport managed by Neon's driver and reconnects automatically.

## How to apply
- Import: `import { drizzle } from "drizzle-orm/neon-serverless";`
- Pool: `new Pool({ connectionString, max: 1 })` from `@neondatabase/serverless`
- Never switch back to `drizzle-orm/node-postgres` without also adding a `pg` package and proper keepAlive config.
