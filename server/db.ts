import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

// Configure WebSocket for Neon serverless driver
if (ws) {
  neonConfig.webSocketConstructor = ws;
}

// Get environment-specific database URL
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'test') {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error("TEST_DATABASE_URL must be set for test environment");
    }
    return process.env.TEST_DATABASE_URL;
  }
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for production environment");
  }
  return process.env.DATABASE_URL;
};

// Different pool settings for serverless vs traditional deployment
const isServerlessEnv = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Create connection pool with environment-specific optimized settings
export const pool = new Pool({ 
  connectionString: getDatabaseUrl(),
  // Serverless environments need fewer connections with shorter timeouts
  max: isServerlessEnv ? 1 : 10,
  idleTimeoutMillis: isServerlessEnv ? 10000 : 30000, // shorter idle timeout in serverless
  connectionTimeoutMillis: 5000, // 5 seconds connection timeout
});

// Initialize Drizzle ORM
export const db = drizzle({ client: pool, schema });

// Export pool for cleanup
export { pool as dbPool };

/**
 * Idempotent startup migrations.
 * All statements use IF NOT EXISTS / IF NOT EXISTS patterns so they are
 * safe to run on every startup against an already-migrated database.
 *
 * Add new migrations here when new tables/columns are introduced so that
 * production deployments that don't run drizzle-kit push automatically
 * still pick up schema changes on the next startup.
 */
export async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // ── 2024-Q4: RFP last-modified tracking ─────────────────────────────
    await client.query(`
      ALTER TABLE rfps
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    `);
    console.log('[DB] Startup migration: rfps.updated_at ensured');

    // ── 2025-Q1: Web Push (VAPID) subscription storage ──────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint      TEXT NOT NULL,
        p256dh        TEXT NOT NULL,
        auth          TEXT NOT NULL,
        user_agent    TEXT,
        created_at    TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // Ensure endpoint is unique (one row per physical browser endpoint).
    // The upsert in createPushSubscription depends on this constraint.
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'push_subscriptions_endpoint_unique'
            AND conrelid = 'push_subscriptions'::regclass
        ) THEN
          ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint);
        END IF;
      END $$;
    `);
    console.log('[DB] Startup migration: push_subscriptions ensured');

    // ── 2025-Q1: Per-user notification preferences (quiet hours, type filters) ─
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id                          SERIAL PRIMARY KEY,
        user_id                     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        quiet_hours_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
        quiet_hours_start           TEXT NOT NULL DEFAULT '22:00',
        quiet_hours_end             TEXT NOT NULL DEFAULT '08:00',
        utc_offset_minutes          INTEGER NOT NULL DEFAULT 0,
        notify_on_rfi_response      BOOLEAN NOT NULL DEFAULT TRUE,
        notify_on_deadline_reminder BOOLEAN NOT NULL DEFAULT TRUE,
        notify_on_new_rfp           BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at                  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // Ensure utc_offset_minutes column exists for existing tables (idempotent)
    await client.query(`
      ALTER TABLE notification_preferences
        ADD COLUMN IF NOT EXISTS utc_offset_minutes INTEGER NOT NULL DEFAULT 0
    `);
    console.log('[DB] Startup migration: notification_preferences ensured');
  } finally {
    client.release();
  }
}