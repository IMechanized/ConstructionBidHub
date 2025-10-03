/**
 * Database storage implementation for FindConstructionBids
 * Handles all database operations and business logic
 */

import { User, InsertUser, Rfp, InsertRfp, users, rfps, rfpAnalytics, rfpViewSessions, RfpAnalytics, RfpViewSession, rfis, type Rfi, type InsertRfi, rfiMessages, type RfiMessage, type InsertRfiMessage, rfiAttachments, type RfiAttachment, type InsertRfiAttachment, notifications, type Notification, type InsertNotification } from "../shared/schema.js";
import { db, pool } from "./db.js";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import session from "express-session";
import { Store } from "express-session";
import ConnectPgSimple from 'connect-pg-simple';

/**
 * Storage Interface
 * Defines all database operations available in the application
 */
export interface IStorage {
  // User Operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // RFP Operations
  getRfps(): Promise<Rfp[]>;
  getFeaturedRfps(): Promise<Rfp[]>;
  getRfpById(id: number): Promise<Rfp | undefined>;
  createRfp(rfp: InsertRfp & { organizationId: number }): Promise<Rfp>;
  updateRfp(id: number, rfp: Partial<Rfp>): Promise<Rfp>;
  deleteRfp(id: number): Promise<void>;

  // Session Store
  sessionStore: Store;

  // Analytics Operations
  getBoostedAnalytics(userId: number): Promise<(RfpAnalytics & { rfp: Rfp })[]>;
  trackRfpView(rfpId: number, userId: number, duration: number): Promise<RfpViewSession>;
  getAnalyticsByRfpId(rfpId: number): Promise<RfpAnalytics | undefined>;
  updateAnalytics(rfpId: number, updates: Partial<RfpAnalytics>): Promise<RfpAnalytics>;

  // RFI Operations
  createRfi(rfi: InsertRfi & { rfpId: number, organizationId?: number }): Promise<Rfi>;
  getRfisByRfp(rfpId: number): Promise<(Rfi & { organization?: User })[]>;
  getRfisByEmail(email: string): Promise<Rfi[]>;
  updateRfiStatus(id: number, status: "pending" | "responded"): Promise<Rfi>;
  deleteRfi(id: number): Promise<void>;
  
  // RFI Conversation Operations
  createRfiMessage(message: InsertRfiMessage): Promise<RfiMessage>;
  getRfiMessages(rfiId: number): Promise<(RfiMessage & { sender: User, attachments?: RfiAttachment[] })[]>;
  getRfiMessageById(messageId: number): Promise<RfiMessage | undefined>;
  createRfiAttachment(attachment: InsertRfiAttachment): Promise<RfiAttachment>;
  getRfiAttachmentById(attachmentId: number): Promise<RfiAttachment | undefined>;
  getRfiAttachments(messageId: number): Promise<RfiAttachment[]>;

  // Notification Operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
}

/**
 * Database Storage Implementation
 * Concrete implementation of the IStorage interface using PostgreSQL
 */
export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    // Use PostgreSQL-based session store for persistence and scalability
    const PgSession = ConnectPgSimple(session);
    this.sessionStore = new PgSession({
      pool: pool, // Use the existing database connection pool
      tableName: 'session', // Table name for session storage
      createTableIfMissing: true, // Automatically create the session table
      pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    });
    console.log('[Storage] PostgreSQL session store initialized');
  }

  /**
   * User Operations
   */
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({
          ...updates,
          companyName: updates.companyName,
          firstName: updates.firstName,
          lastName: updates.lastName,
          jobTitle: updates.jobTitle,
          telephone: updates.telephone,
          cell: updates.cell,
          trade: updates.trade,
          certificationName: updates.certificationName,
          logo: updates.logo,
          language: updates.language,
          failedLoginAttempts: updates.failedLoginAttempts,
          accountLockedUntil: updates.accountLockedUntil
        })
        .where(eq(users.id, id))
        .returning();
      
      if (!user) throw new Error("User not found");
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * RFP Operations
   */
  async getRfps(): Promise<Rfp[]> {
    return db.select().from(rfps);
  }

  async getFeaturedRfps(): Promise<Rfp[]> {
    return db.select().from(rfps).where(eq(rfps.featured, true));
  }

  async getRfpById(id: number): Promise<Rfp | undefined> {
    const [rfp] = await db.select().from(rfps).where(eq(rfps.id, id));
    return rfp;
  }

  async createRfp(rfp: InsertRfp & { organizationId: number }): Promise<Rfp> {
    const [newRfp] = await db
      .insert(rfps)
      .values({
        title: rfp.title,
        description: rfp.description,
        walkthroughDate: new Date(rfp.walkthroughDate),
        rfiDate: new Date(rfp.rfiDate),
        deadline: new Date(rfp.deadline),
        jobStreet: rfp.jobStreet,
        jobCity: rfp.jobCity,
        jobState: rfp.jobState,
        jobZip: rfp.jobZip,
        budgetMin: rfp.budgetMin || null,
        certificationGoals: rfp.certificationGoals || null,
        portfolioLink: rfp.portfolioLink || null,
        organizationId: rfp.organizationId,
        featured: rfp.featured || false,
      })
      .returning();
    return newRfp;
  }

  /**
   * Analytics Operations
   */
  async getBoostedAnalytics(userId: number): Promise<(RfpAnalytics & { rfp: Rfp })[]> {
    // Create proper SQL date from current date
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log(`getBoostedAnalytics: Getting analytics for user ID ${userId} for date ${formattedDate}`);

    // Get only the featured RFPs created by this user - being extra explicit with ownership checks
    const featuredRfps = await db
      .select()
      .from(rfps)
      .where(
        and(
          eq(rfps.featured, true),
          eq(rfps.organizationId, userId)
        )
      );
    
    // Extra safety check: only include RFPs that are actually owned by this user
    const ownedRfps = featuredRfps.filter(rfp => rfp.organizationId === userId);
    
    if (ownedRfps.length !== featuredRfps.length) {
      console.error(`ERROR: Found ${featuredRfps.length - ownedRfps.length} RFPs that matched featured criteria but don't belong to user ${userId}`);
    }
    
    console.log(`getBoostedAnalytics: Found ${ownedRfps.length} featured RFPs for this user`);
    
    // Log detailed RFP info
    ownedRfps.forEach(rfp => {
      console.log(`RFP ID: ${rfp.id}, Title: ${rfp.title}, OrganizationId: ${rfp.organizationId}`);
    });

    // For each featured RFP owned by this user, get or create an analytics record
    const analyticsPromises = ownedRfps.map(async (rfp) => {
      try {
        // Check if analytics exist for today
        const [existingAnalytics] = await db
          .select()
          .from(rfpAnalytics)
          .where(
            and(
              eq(rfpAnalytics.rfpId, rfp.id),
              eq(rfpAnalytics.date, formattedDate)
            )
          );

        console.log(`Processing RFP ${rfp.id}: ${existingAnalytics ? 'Analytics exist' : 'Creating new analytics'}`);

        if (existingAnalytics) {
          // Return existing analytics with RFP data
          return { ...existingAnalytics, rfp };
        } else {
          // Create new analytics record with default values
          const [newAnalytics] = await db
            .insert(rfpAnalytics)
            .values({
              rfpId: rfp.id,
              date: formattedDate,
              totalViews: 0,
              uniqueViews: 0,
              averageViewTime: 0,
              totalBids: 0,
              clickThroughRate: 0,
            })
            .returning();
          
          console.log(`Created new analytics for RFP ${rfp.id}`);
          
          // Return new analytics with RFP data
          return { ...newAnalytics, rfp };
        }
      } catch (error) {
        console.error(`Error processing analytics for RFP ${rfp.id}:`, error);
        // Return a default structure with the RFP to avoid breaking the entire analytics collection
        return {
          id: -1, // Use a placeholder ID
          rfpId: rfp.id,
          date: formattedDate,
          totalViews: 0,
          uniqueViews: 0,
          averageViewTime: 0,
          totalBids: 0,
          clickThroughRate: 0,
          rfp
        };
      }
    });

    try {
      // Wait for all analytics records to be fetched or created
      const results = await Promise.all(analyticsPromises);
      console.log(`getBoostedAnalytics: Returning ${results.length} analytics records`);
      
      return results;
    } catch (error) {
      console.error("Error in getBoostedAnalytics:", error);
      return []; // Return empty array in case of error to avoid crashing
    }
  }

  /**
   * Tracks a view session for an RFP and updates analytics
   */
  async trackRfpView(rfpId: number, userId: number, duration: number): Promise<RfpViewSession> {
    try {
      // Create view session record
      const [viewSession] = await db
        .insert(rfpViewSessions)
        .values({
          rfpId,
          userId,
          viewDate: new Date(),
          duration,
        })
        .returning();

      // Update analytics for the day
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const [existingAnalytics] = await db
        .select()
        .from(rfpAnalytics)
        .where(
          and(
            eq(rfpAnalytics.rfpId, rfpId),
            eq(rfpAnalytics.date, formattedDate)
          )
        );

      if (existingAnalytics) {
        // Update existing analytics record
        await db
          .update(rfpAnalytics)
          .set({
            totalViews: sql`${rfpAnalytics.totalViews} + 1`,
            uniqueViews: sql`${rfpAnalytics.uniqueViews} + CASE WHEN NOT EXISTS (
              SELECT 1 FROM ${rfpViewSessions} 
              WHERE rfp_id = ${rfpId} 
              AND user_id = ${userId} 
              AND view_date::date = CURRENT_DATE
            ) THEN 1 ELSE 0 END`,
            averageViewTime: sql`(${rfpAnalytics.averageViewTime} * ${rfpAnalytics.totalViews} + ${duration}) / (${rfpAnalytics.totalViews} + 1)`,
          })
          .where(eq(rfpAnalytics.id, existingAnalytics.id));
      } else {
        // Create new analytics record
        await db
          .insert(rfpAnalytics)
          .values({
            rfpId,
            date: formattedDate,
            totalViews: 1,
            uniqueViews: 1,
            averageViewTime: duration,
            totalBids: 0,
            clickThroughRate: 0,
          });
      }

      return viewSession;
    } catch (error) {
      console.error("Error tracking RFP view:", error);
      throw error; // Re-throw to allow the caller to handle it
    }
  }

  /**
   * RFI Operations
   */
  async createRfi(rfi: InsertRfi & { rfpId: number, organizationId?: number }): Promise<Rfi> {
    // Remove organizationId before inserting since it doesn't exist in the database schema
    const { organizationId, ...rfiData } = rfi;
    
    const [newRfi] = await db
      .insert(rfis)
      .values(rfiData)
      .returning();
    return newRfi;
  }

  async getRfisByRfp(rfpId: number): Promise<(Rfi & { organization?: User })[]> {
    // Get RFIs first
    const results = await db
      .select()
      .from(rfis)
      .where(eq(rfis.rfpId, rfpId));
    
    // Then for each RFI, try to look up the organization by email
    const rfisWithOrg = await Promise.all(results.map(async (rfi) => {
      const [organization] = await db
        .select()
        .from(users)
        .where(eq(users.email, rfi.email))
        .limit(1);
        
      return {
        ...rfi,
        organization: organization || undefined
      };
    }));
    
    return rfisWithOrg;
  }

  async getRfisByEmail(email: string): Promise<Rfi[]> {
    return db
      .select()
      .from(rfis)
      .where(eq(rfis.email, email))
      .orderBy(desc(rfis.createdAt));
  }
  
  async updateRfiStatus(id: number, status: "pending" | "responded"): Promise<Rfi> {
    const [updatedRfi] = await db
      .update(rfis)
      .set({ status })
      .where(eq(rfis.id, id))
      .returning();
    if (!updatedRfi) throw new Error("RFI not found");
    return updatedRfi;
  }

  async deleteRfi(id: number): Promise<void> {
    // First delete RFI attachments
    await db.delete(rfiAttachments)
      .where(inArray(rfiAttachments.messageId, 
        db.select({ id: rfiMessages.id })
          .from(rfiMessages)
          .where(eq(rfiMessages.rfiId, id))
      ));
    
    // Then delete RFI messages
    await db.delete(rfiMessages).where(eq(rfiMessages.rfiId, id));
    
    // Finally delete the RFI itself
    await db.delete(rfis).where(eq(rfis.id, id));
  }

  // RFI Conversation Operations
  async createRfiMessage(message: InsertRfiMessage): Promise<RfiMessage> {
    const [newMessage] = await db
      .insert(rfiMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getRfiMessages(rfiId: number): Promise<(RfiMessage & { sender: User, attachments?: RfiAttachment[] })[]> {
    // Get messages with sender information
    const messages = await db
      .select({
        id: rfiMessages.id,
        rfiId: rfiMessages.rfiId,
        senderId: rfiMessages.senderId,
        message: rfiMessages.message,
        createdAt: rfiMessages.createdAt,
        sender: users
      })
      .from(rfiMessages)
      .innerJoin(users, eq(rfiMessages.senderId, users.id))
      .where(eq(rfiMessages.rfiId, rfiId))
      .orderBy(rfiMessages.createdAt);

    // Get attachments for each message
    const messagesWithAttachments = await Promise.all(
      messages.map(async (msg) => {
        const attachments = await this.getRfiAttachments(msg.id);
        return {
          ...msg,
          attachments
        };
      })
    );

    return messagesWithAttachments;
  }

  async createRfiAttachment(attachment: InsertRfiAttachment): Promise<RfiAttachment> {
    const [newAttachment] = await db
      .insert(rfiAttachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }

  async getRfiMessageById(messageId: number): Promise<RfiMessage | undefined> {
    const [message] = await db
      .select({
        id: rfiMessages.id,
        rfiId: rfiMessages.rfiId,
        senderId: rfiMessages.senderId,
        message: rfiMessages.message,
        createdAt: rfiMessages.createdAt,
      })
      .from(rfiMessages)
      .where(eq(rfiMessages.id, messageId));
    return message;
  }

  async getRfiAttachmentById(attachmentId: number): Promise<RfiAttachment | undefined> {
    const [attachment] = await db
      .select()
      .from(rfiAttachments)
      .where(eq(rfiAttachments.id, attachmentId));
    return attachment;
  }

  async getRfiAttachments(messageId: number): Promise<RfiAttachment[]> {
    return db
      .select()
      .from(rfiAttachments)
      .where(eq(rfiAttachments.messageId, messageId))
      .orderBy(rfiAttachments.uploadedAt);
  }

  async updateRfp(id: number, updates: Partial<Rfp>): Promise<Rfp> {
    const [rfp] = await db
      .update(rfps)
      .set(updates)
      .where(eq(rfps.id, id))
      .returning();
    if (!rfp) throw new Error("RFP not found");
    return rfp;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async deleteRfp(id: number): Promise<void> {
    await db.delete(rfps).where(eq(rfps.id, id));
  }

  async getAnalyticsByRfpId(rfpId: number): Promise<RfpAnalytics | undefined> {
    try {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const [analytics] = await db
        .select()
        .from(rfpAnalytics)
        .where(
          and(
            eq(rfpAnalytics.rfpId, rfpId),
            eq(rfpAnalytics.date, formattedDate)
          )
        );

      return analytics;
    } catch (error) {
      console.error(`Error getting analytics for RFP ${rfpId}:`, error);
      return undefined;
    }
  }

  async updateAnalytics(rfpId: number, updates: Partial<RfpAnalytics>): Promise<RfpAnalytics> {
    try {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const [analytics] = await db
        .select()
        .from(rfpAnalytics)
        .where(
          and(
            eq(rfpAnalytics.rfpId, rfpId),
            eq(rfpAnalytics.date, formattedDate)
          )
        );

      if (analytics) {
        const [updated] = await db
          .update(rfpAnalytics)
          .set(updates)
          .where(eq(rfpAnalytics.id, analytics.id))
          .returning();
        return updated;
      }

      const [newAnalytics] = await db
        .insert(rfpAnalytics)
        .values({
          rfpId,
          date: formattedDate,
          totalViews: 0,
          uniqueViews: 0,
          averageViewTime: 0,
          totalBids: 0,
          clickThroughRate: 0,
          ...updates,
        })
        .returning();

      return newAnalytics;
    } catch (error) {
      console.error(`Error updating analytics for RFP ${rfpId}:`, error);
      throw error;
    }
  }

  /**
   * Notification Operations
   */
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    if (!updated) throw new Error("Notification not found");
    return updated;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
}

// Export a single instance of the storage implementation
export const storage = new DatabaseStorage();