import { User, InsertUser, Rfp, InsertRfp, Bid, InsertBid, Employee, InsertEmployee, users, rfps, bids, employees, rfpAnalytics, rfpViewSessions, RfpAnalytics, RfpViewSession } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";
import { rfis, type Rfi, type InsertRfi } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  getRfps(): Promise<Rfp[]>;
  getFeaturedRfps(): Promise<Rfp[]>;
  getRfpById(id: number): Promise<Rfp | undefined>;
  createRfp(rfp: InsertRfp & { organizationId: number }): Promise<Rfp>;
  updateRfp(id: number, rfp: Partial<Rfp>): Promise<Rfp>;
  deleteRfp(id: number): Promise<void>;

  getBids(rfpId: number): Promise<Bid[]>;
  createBid(bid: InsertBid & { rfpId: number; contractorId: number }): Promise<Bid>;
  deleteBid(id: number): Promise<void>;

  getEmployees(organizationId: number): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee & { organizationId: number }): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  sessionStore: Store;

  // Analytics methods
  getBoostedAnalytics(): Promise<(RfpAnalytics & { rfp: Rfp })[]>;
  trackRfpView(rfpId: number, userId: number, duration: number): Promise<RfpViewSession>;
  getAnalyticsByRfpId(rfpId: number): Promise<RfpAnalytics | undefined>;
  updateAnalytics(rfpId: number, updates: Partial<RfpAnalytics>): Promise<RfpAnalytics>;
  getBidsByContractor(contractorId: number): Promise<Bid[]>;

  // Add RFI methods
  createRfi(rfi: InsertRfi & { rfpId: number }): Promise<Rfi>;
  getRfisByRfp(rfpId: number): Promise<Rfi[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

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

  async updateRfp(id: number, updates: Partial<Rfp>): Promise<Rfp> {
    const [rfp] = await db
      .update(rfps)
      .set(updates)
      .where(eq(rfps.id, id))
      .returning();
    if (!rfp) throw new Error("RFP not found");
    return rfp;
  }

  async getBids(rfpId: number): Promise<Bid[]> {
    return db.select().from(bids).where(eq(bids.rfpId, rfpId));
  }

  async createBid(bid: InsertBid & { rfpId: number; contractorId: number }): Promise<Bid> {
    const [newBid] = await db.insert(bids).values(bid).returning();
    return newBid;
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

  async deleteBid(id: number): Promise<void> {
    await db.delete(bids).where(eq(bids.id, id));
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getBoostedAnalytics(): Promise<(RfpAnalytics & { rfp: Rfp })[]> {
    const today = new Date().toISOString().split('T')[0];

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

  async trackRfpView(rfpId: number, userId: number, duration: number): Promise<RfpViewSession> {
    // Create or update view session
    const [viewSession] = await db
      .insert(rfpViewSessions)
      .values({
        rfpId,
        userId,
        viewDate: new Date(),
        duration,
      })
      .returning();

    // Update analytics
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
  async getBidsByContractor(contractorId: number): Promise<Bid[]> {
    return db.select().from(bids).where(eq(bids.contractorId, contractorId));
  }
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
}

export const storage = new DatabaseStorage();