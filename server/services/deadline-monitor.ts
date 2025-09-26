/**
 * Deadline Monitoring Service
 * Monitors RFP deadlines and sends notifications to relevant users
 */

import { storage } from '../storage.js';
import { db } from '../db.js';
import { rfps, users } from '../../shared/schema.js';
import { eq, lt, gte, and } from 'drizzle-orm';

export class DeadlineMonitorService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the deadline monitoring service
   * Checks for upcoming deadlines every hour
   */
  start() {
    if (this.isRunning) {
      console.log('Deadline monitor service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting deadline monitor service...');
    
    // Run immediately on start
    this.checkDeadlines();
    
    // Run every hour (3600000 ms)
    this.intervalId = setInterval(() => {
      this.checkDeadlines();
    }, 3600000);
    
    console.log('Deadline monitor service started successfully');
  }

  /**
   * Stop the deadline monitoring service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Deadline monitor service stopped');
  }

  /**
   * Check for upcoming deadlines and send notifications
   */
  private async checkDeadlines() {
    try {
      console.log('Checking for upcoming deadlines...');
      
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Get all active RFPs with upcoming deadlines
      const activeRfps = await db
        .select()
        .from(rfps)
        .leftJoin(users, eq(rfps.organizationId, users.id))
        .where(
          and(
            eq(rfps.status, 'open'),
            // Check for deadlines within the next 7 days
            gte(rfps.deadline, now),
            lt(rfps.deadline, in7Days)
          )
        );

      for (const { rfps: rfp, users: organization } of activeRfps) {
        if (!organization) continue;

        // Check for 24-hour deadline warnings
        if (new Date(rfp.deadline) <= in24Hours) {
          await this.sendDeadlineNotification(
            organization.id,
            rfp,
            'deadline_24h',
            '24 hours'
          );
        }
        // Check for 72-hour deadline warnings
        else if (new Date(rfp.deadline) <= in72Hours) {
          await this.sendDeadlineNotification(
            organization.id,
            rfp,
            'deadline_72h',
            '3 days'
          );
        }
        // Check for 7-day deadline warnings
        else if (new Date(rfp.deadline) <= in7Days) {
          await this.sendDeadlineNotification(
            organization.id,
            rfp,
            'deadline_7d',
            '7 days'
          );
        }

        // Check RFI date deadlines
        if (new Date(rfp.rfiDate) <= in24Hours && new Date(rfp.rfiDate) > now) {
          await this.sendRfiDeadlineNotification(organization.id, rfp);
        }

        // Check walkthrough date reminders
        if (new Date(rfp.walkthroughDate) <= in24Hours && new Date(rfp.walkthroughDate) > now) {
          await this.sendWalkthroughReminderNotification(organization.id, rfp);
        }
      }

      console.log(`Deadline check completed for ${activeRfps.length} active RFPs`);
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }

  /**
   * Send deadline notification to user
   */
  private async sendDeadlineNotification(
    userId: number,
    rfp: any,
    notificationType: string,
    timeframe: string
  ) {
    try {
      // Check if we already sent this notification recently
      const existingNotifications = await storage.getNotificationsByUser(userId);
      const recentNotification = existingNotifications.find(n => 
        n.relatedId === rfp.id && 
        n.relatedType === 'rfp' && 
        n.message.includes(timeframe) &&
        // Only consider notifications from the last 2 hours
        new Date(n.createdAt).getTime() > (Date.now() - 2 * 60 * 60 * 1000)
      );

      if (recentNotification) {
        console.log(`Deadline notification already sent recently for RFP ${rfp.id}`);
        return;
      }

      const notification = await storage.createNotification({
        userId,
        type: 'deadline_reminder',
        title: `Deadline Reminder: ${timeframe} remaining`,
        message: `The deadline for "${rfp.title}" is approaching in ${timeframe}. Don't miss out on this opportunity!`,
        relatedId: rfp.id,
        relatedType: 'rfp'
      });

      // Send real-time notification
      if ((global as any).sendNotificationToUser) {
        (global as any).sendNotificationToUser(userId, notification);
      }

      console.log(`Deadline notification sent to user ${userId} for RFP ${rfp.id} (${timeframe} remaining)`);
    } catch (error) {
      console.error(`Error sending deadline notification for RFP ${rfp.id}:`, error);
    }
  }

  /**
   * Send RFI deadline notification
   */
  private async sendRfiDeadlineNotification(userId: number, rfp: any) {
    try {
      const notification = await storage.createNotification({
        userId,
        type: 'deadline_reminder',
        title: 'RFI Deadline Tomorrow',
        message: `The deadline for submitting questions about "${rfp.title}" is tomorrow. Submit your RFIs now!`,
        relatedId: rfp.id,
        relatedType: 'rfp'
      });

      // Send real-time notification
      if ((global as any).sendNotificationToUser) {
        (global as any).sendNotificationToUser(userId, notification);
      }

      console.log(`RFI deadline notification sent to user ${userId} for RFP ${rfp.id}`);
    } catch (error) {
      console.error(`Error sending RFI deadline notification for RFP ${rfp.id}:`, error);
    }
  }

  /**
   * Send walkthrough reminder notification
   */
  private async sendWalkthroughReminderNotification(userId: number, rfp: any) {
    try {
      const notification = await storage.createNotification({
        userId,
        type: 'deadline_reminder',
        title: 'Site Walkthrough Tomorrow',
        message: `Don't forget about the site walkthrough for "${rfp.title}" tomorrow at ${new Date(rfp.walkthroughDate).toLocaleTimeString()}.`,
        relatedId: rfp.id,
        relatedType: 'rfp'
      });

      // Send real-time notification
      if ((global as any).sendNotificationToUser) {
        (global as any).sendNotificationToUser(userId, notification);
      }

      console.log(`Walkthrough reminder sent to user ${userId} for RFP ${rfp.id}`);
    } catch (error) {
      console.error(`Error sending walkthrough reminder for RFP ${rfp.id}:`, error);
    }
  }
}

// Export singleton instance
export const deadlineMonitor = new DeadlineMonitorService();