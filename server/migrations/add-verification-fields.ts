/**
 * Database migration to add email verification and password reset fields
 * Safely adds new columns without affecting existing data
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { fileURLToPath } from 'url';
import path from 'path';

async function migrate() {
  console.log("Starting migration to add verification fields");

  try {
    // Add email verification fields
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_token TEXT,
      ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
    `);
    
    console.log("Migration successful: Added verification fields to users table");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run the migration if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  migrate()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export default migrate;