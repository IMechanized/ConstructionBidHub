/**
 * Database schema definitions and types for the FindConstructionBids platform.
 * This file contains all database tables, their relationships, and validation schemas.
 */

import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Users Table
 * Stores both contractor and government organization profiles
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  contact: text("contact"),                    // Primary contact person
  telephone: text("telephone"),                // Office phone
  cell: text("cell"),                         // Mobile phone
  businessEmail: text("business_email"),       // Secondary/business email
  isMinorityOwned: boolean("is_minority_owned").default(false),
  minorityGroup: text("minority_group"),       // Specific minority classification
  trade: text("trade"),                       // Primary trade/industry
  certificationName: text("certification_name"), // Business certifications
  logo: text("logo"),                         // Company logo URL
  onboardingComplete: boolean("onboarding_complete").default(false),
  status: text("status", { enum: ["active", "deactivated"] }).default("active"),
  language: text("language").default("en"),    // User language preference
});

/**
 * RFPs (Request for Proposals) Table
 * Core table for bid opportunities
 */
export const rfps = pgTable("rfps", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  walkthroughDate: timestamp("walkthrough_date").notNull(),  // Site visit date
  rfiDate: timestamp("rfi_date").notNull(),                  // Last day for questions
  deadline: timestamp("deadline").notNull(),                 // Bid submission deadline
  budgetMin: integer("budget_min"),                         // Minimum budget (optional)
  certificationGoals: text("certification_goals"),          // Required certifications
  jobLocation: text("job_location").notNull(),
  portfolioLink: text("portfolio_link"),                    // Additional resources
  status: text("status", { enum: ["open", "closed"] }).default("open"),
  organizationId: integer("organization_id").references(() => users.id),
  featured: boolean("featured").default(false),             // Promoted/featured status
  featuredAt: timestamp("featured_at"),                    // When the RFP was featured
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * RFP Analytics Table
 * Tracks engagement metrics for RFPs
 */
export const rfpAnalytics = pgTable("rfp_analytics", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  date: date("date").notNull(),                            // Analytics date
  totalViews: integer("total_views").default(0),           // Total page views
  uniqueViews: integer("unique_views").default(0),         // Unique visitors
  averageViewTime: integer("average_view_time").default(0), // Avg. time on page (seconds)
  totalBids: integer("total_bids").default(0),             // Number of bids received
  clickThroughRate: integer("click_through_rate").default(0), // CTR percentage
});

/**
 * RFP View Sessions Table
 * Detailed tracking of individual view sessions
 */
export const rfpViewSessions = pgTable("rfp_view_sessions", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  userId: integer("user_id").references(() => users.id),
  viewDate: timestamp("view_date").notNull(),
  duration: integer("duration").default(0),                 // Session duration (seconds)
  convertedToBid: boolean("converted_to_bid").default(false),
});

/**
 * Employees Table
 * Organization team members and their roles
 */
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => users.id),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status", { enum: ["pending", "active"] }).default("pending"),
});

/**
 * RFIs (Request for Information) Table
 * Questions and clarifications for RFPs
 */
export const rfis = pgTable("rfis", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  email: text("email").notNull(),                          // Requester's email
  message: text("message").notNull(),                      // Question/request
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status", { enum: ["pending", "responded"] }).default("pending"),
});

/**
 * Backup Logs Table
 * Tracks database backup operations
 */
export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  status: text("status", { enum: ["success", "failed"] }).notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Validation Schemas
 */

// Onboarding form validation
export const onboardingSchema = z.object({
  contact: z.string().min(1, "Contact name is required"),
  telephone: z.string().min(1, "Telephone number is required"),
  cell: z.string().min(1, "Cell phone number is required"),
  businessEmail: z.string().email("Invalid email address"),
  isMinorityOwned: z.boolean(),
  minorityGroup: z.string().optional(),
  trade: z.string().min(1, "Trade is required"),
  certificationName: z.string().optional(),
  logo: z.any().optional(),
});

// User creation validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  companyName: true,
});

// RFP creation validation
export const insertRfpSchema = createInsertSchema(rfps)
  .pick({
    title: true,
    description: true,
    walkthroughDate: true,
    rfiDate: true,
    deadline: true,
    budgetMin: true,
    certificationGoals: true,
    jobLocation: true,
    portfolioLink: true,
    featured: true,
  })
  .extend({
    walkthroughDate: z.string(),
    rfiDate: z.string(),
    deadline: z.string(),
    budgetMin: z.number().min(0, "Minimum budget must be a positive number").nullish(),
    jobLocation: z.string().min(1, "Job location is required"),
    certificationGoals: z.string().nullish(),
    portfolioLink: z.string().url("Portfolio link must be a valid URL").nullish().or(z.literal("")),
    featured: z.boolean().default(false),
  });

// Employee creation validation
export const insertEmployeeSchema = createInsertSchema(employees).pick({
  email: true,
  role: true,
});

// RFI creation validation
export const insertRfiSchema = createInsertSchema(rfis).pick({
  email: true,
  message: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Rfp = typeof rfps.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertRfp = z.infer<typeof insertRfpSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type RfpAnalytics = typeof rfpAnalytics.$inferSelect;
export type RfpViewSession = typeof rfpViewSessions.$inferSelect;
export type Rfi = typeof rfis.$inferSelect;
export type InsertRfi = z.infer<typeof insertRfiSchema>;
export type BackupLog = typeof backupLogs.$inferSelect;
export type InsertBackupLog = typeof backupLogs.$inferInsert;