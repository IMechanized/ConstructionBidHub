import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { db, pool } from '../db';
import { sql } from 'drizzle-orm';

const execAsync = promisify(exec);

// Ensure backup directory exists
const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    // Get database connection details from environment
    const { PGDATABASE, PGUSER, PGPASSWORD, PGHOST, PGPORT } = process.env;

    // Create backup using pg_dump
    const command = `PGPASSWORD=${PGPASSWORD} pg_dump -h ${PGHOST} -p ${PGPORT} -U ${PGUSER} -d ${PGDATABASE} -F p -f ${filepath}`;

    await execAsync(command);
    console.log(`Backup created successfully: ${filename}`);

    // Log backup event to database
    await db.execute(
      sql`INSERT INTO backup_logs (filename, status, created_at) VALUES (${filename}, 'success', NOW())`
    );

    return filepath;
  } catch (error) {
    console.error('Backup failed:', error);

    // Log failed backup attempt with proper error type casting
    await db.execute(
      sql`INSERT INTO backup_logs (filename, status, error, created_at) VALUES (${filename}, 'failed', ${(error as Error).message}, NOW())`
    );

    throw error;
  }
}

export async function listBackups(): Promise<string[]> {
  return fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse();
}

export async function cleanupOldBackups(keepLastN: number = 5): Promise<void> {
  const backups = await listBackups();

  if (backups.length > keepLastN) {
    const toDelete = backups.slice(keepLastN);
    for (const backup of toDelete) {
      const filepath = path.join(BACKUP_DIR, backup);
      fs.unlinkSync(filepath);
      console.log(`Deleted old backup: ${backup}`);
    }
  }
}