/**
 * Database storage implementation for FindConstructionBids
 * Handles all database operations and business logic
 */

import { User, InsertUser, Rfp, InsertRfp, Employee, InsertEmployee, users, rfps, employees, rfpAnalytics, rfpViewSessions, RfpAnalytics, RfpViewSession } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";
import { rfis, type Rfi, type InsertRfi } from "@shared/schema";

// Initialize memory store for session management
const MemoryStore = createMemoryStore(session);

/**
 * Storage Interface
 * Defines all database operations available in the application
 */
export interface IStorage {
  // User Operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(email: string): Promise<User | undefined>;
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

  // Employee Operations
  getEmployees(organizationId: number): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee & { organizationId: number }): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Session Store
  sessionStore: Store;

  // Analytics Operations
  getBoostedAnalytics(): Promise<(RfpAnalytics & { rfp: Rfp })[]>;
  trackRfpView(rfpId: number, userId: number, duration: number): Promise<RfpViewSession>;
  getAnalyticsByRfpId(rfpId: number): Promise<RfpAnalytics | undefined>;
  updateAnalytics(rfpId: number, updates: Partial<RfpAnalytics>): Promise<RfpAnalytics>;

  // RFI Operations
  createRfi(rfi: InsertRfi & { rfpId: number }): Promise<Rfi>;
  getRfisByRfp(rfpId: number): Promise<Rfi[]>;
  getRfisByEmail(email: string): Promise<Rfi[]>;

  // Add new pagination method
  getRfpsWithPagination(offset: number, limit: number): Promise<{ rfps: Rfp[], total: number }>;
}

/**
 * Database Storage Implementation
 * Concrete implementation of the IStorage interface using PostgreSQL
 */
export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 }); // 24 hours
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
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
        jobLocation: rfp.jobLocation,
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
  async getBoostedAnalytics(): Promise<(RfpAnalytics & { rfp: Rfp })[]> {
    const today = new Date().toISOString().split('T')[0];

    // Get analytics for featured RFPs with their details
    const results = await db
      .select({
        analytics: rfpAnalytics,
        rfp: rfps,
      })
      .from(rfpAnalytics)
      .innerJoin(rfps, eq(rfpAnalytics.rfpId, rfps.id))
      .where(
        and(
          eq(rfps.featured, true),
          eq(rfpAnalytics.date, today)
        )
      );

    return results.map(r => ({ ...r.analytics, rfp: r.rfp }));
  }

  /**
   * Tracks a view session for an RFP and updates analytics
   */
  async trackRfpView(rfpId: number, userId: number, duration: number): Promise<RfpViewSession> {
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
    const today = new Date().toISOString().split('T')[0];
    const [existingAnalytics] = await db
      .select()
      .from(rfpAnalytics)
      .where(
        and(
          eq(rfpAnalytics.rfpId, rfpId),
          eq(rfpAnalytics.date, today)
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
          date: today,
          totalViews: 1,
          uniqueViews: 1,
          averageViewTime: duration,
          totalBids: 0,
          clickThroughRate: 0,
        });
    }

    return viewSession;
  }

  /**
   * RFI Operations
   */
  async createRfi(rfi: InsertRfi & { rfpId: number }): Promise<Rfi> {
    const [newRfi] = await db
      .insert(rfis)
      .values(rfi)
      .returning();
    return newRfi;
  }

  async getRfisByRfp(rfpId: number): Promise<Rfi[]> {
    return db
      .select()
      .from(rfis)
      .where(eq(rfis.rfpId, rfpId));
  }

  async getRfisByEmail(email: string): Promise<Rfi[]> {
    return db
      .select()
      .from(rfis)
      .where(eq(rfis.email, email))
      .orderBy(desc(rfis.createdAt));
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

  async getEmployees(organizationId: number): Promise<Employee[]> {
    return db
      .select()
      .from(employees)
      .where(eq(employees.organizationId, organizationId));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(
    employee: InsertEmployee & { organizationId: number }
  ): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values({ ...employee, status: "pending" })
      .returning();
    return newEmployee;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async deleteRfp(id: number): Promise<void> {
    await db.delete(rfps).where(eq(rfps.id, id));
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getAnalyticsByRfpId(rfpId: number): Promise<RfpAnalytics | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [analytics] = await db
      .select()
      .from(rfpAnalytics)
      .where(
        and(
          eq(rfpAnalytics.rfpId, rfpId),
          eq(rfpAnalytics.date, today)
        )
      );

    return analytics;
  }

  async updateAnalytics(rfpId: number, updates: Partial<RfpAnalytics>): Promise<RfpAnalytics> {
    const today = new Date().toISOString().split('T')[0];
    const [analytics] = await db
      .select()
      .from(rfpAnalytics)
      .where(
        and(
          eq(rfpAnalytics.rfpId, rfpId),
          eq(rfpAnalytics.date, today)
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
        date: today,
        totalViews: 0,
        uniqueViews: 0,
        averageViewTime: 0,
        totalBids: 0,
        clickThroughRate: 0,
        ...updates,
      })
      .returning();

    return newAnalytics;
  }

  /**
   * Get paginated RFPs
   */
  async getRfpsWithPagination(offset: number, limit: number): Promise<{ rfps: Rfp[], total: number }> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfps);

    const paginatedRfps = await db
      .select()
      .from(rfps)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(rfps.createdAt));

    return {
      rfps: paginatedRfps,
      total: Number(count)
    };
  }
}

// Export a single instance of the storage implementation
export const storage = new DatabaseStorage();