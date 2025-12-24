/**
 * Database migration to add slug field to RFPs table
 * This enables SEO-friendly URLs with state and slug pattern
 */

import { db } from "../db.js";
import { sql } from "drizzle-orm";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

async function migrate() {
  console.log("Starting migration: Add slug field to RFPs table");

  try {
    // Add slug column
    await db.execute(sql`ALTER TABLE rfps ADD COLUMN IF NOT EXISTS slug TEXT`);
    console.log("Added slug column to rfps table");

    // Fetch all existing RFPs to generate slugs
    const rfps = await db.execute(sql`SELECT id, title, job_state FROM rfps WHERE slug IS NULL`);
    
    console.log(`Found ${rfps.rows.length} RFPs needing slugs`);

    // Generate slugs for existing RFPs
    for (const rfp of rfps.rows) {
      const baseSlug = generateSlug(rfp.title as string);
      let slug = baseSlug;
      let counter = 1;

      // Check for uniqueness within same state
      while (true) {
        const existing = await db.execute(
          sql`SELECT id FROM rfps WHERE job_state = ${rfp.job_state} AND slug = ${slug} AND id != ${rfp.id}`
        );
        if (existing.rows.length === 0) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await db.execute(sql`UPDATE rfps SET slug = ${slug} WHERE id = ${rfp.id}`);
      console.log(`Updated RFP ${rfp.id}: slug = ${slug}`);
    }

    console.log("Migration successful: Added slug field and generated slugs for existing RFPs");
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
