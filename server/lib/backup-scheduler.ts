import { createBackup, cleanupOldBackups } from './backup';

// Schedule configuration
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const KEEP_LAST_N_BACKUPS = 7; // Keep last 7 backups

export function startBackupScheduler() {
  console.log('Starting automated backup scheduler');
  
  // Perform initial backup
  performBackup();
  
  // Schedule regular backups
  setInterval(performBackup, BACKUP_INTERVAL);
}

async function performBackup() {
  try {
    console.log('Starting scheduled backup...');
    await createBackup();
    await cleanupOldBackups(KEEP_LAST_N_BACKUPS);
    console.log('Scheduled backup completed successfully');
  } catch (error) {
    console.error('Scheduled backup failed:', error);
  }
}
