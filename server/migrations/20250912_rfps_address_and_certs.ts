/**
 * Database migration to update RFPs table:
 * - Replace job_location with separate address fields
 * - Convert certification_goals from text to text array
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Starting migration: RFPs address and certifications schema update");

  try {
    // Add new address columns
    await db.execute(sql`ALTER TABLE rfps ADD COLUMN IF NOT EXISTS job_street text`);
    await db.execute(sql`ALTER TABLE rfps ADD COLUMN IF NOT EXISTS job_city text`);
    await db.execute(sql`ALTER TABLE rfps ADD COLUMN IF NOT EXISTS job_state text`);
    await db.execute(sql`ALTER TABLE rfps ADD COLUMN IF NOT EXISTS job_zip text`);
    
    // Backfill job_street from job_location (keeping original data in street field)
    await db.execute(sql`UPDATE rfps SET job_street = job_location WHERE job_street IS NULL AND job_location IS NOT NULL`);
    
    // Convert certification_goals from text to text array
    await db.execute(sql`
      ALTER TABLE rfps ALTER COLUMN certification_goals TYPE text[] 
      USING CASE 
        WHEN certification_goals IS NULL THEN NULL 
        ELSE ARRAY[certification_goals]::text[] 
      END
    `);
    
    // Drop the old job_location column
    await db.execute(sql`ALTER TABLE rfps DROP COLUMN IF EXISTS job_location`);
    
    console.log("Migration successful: Updated RFPs address and certification fields");
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