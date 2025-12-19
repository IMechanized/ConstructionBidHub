/**
 * Database schema definitions and types for the FindConstructionBids platform.
 * This file contains all database tables, their relationships, and validation schemas.
 */

import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// List of available certifications
export const CERTIFICATIONS = [
  "None",
  "Women-owned",
  "Native American-owned",
  "Veteran-owned",
  "Military spouse",
  "LGBTQ-owned",
  "Rural",
  "Minority-owned",
  "Section 3",
  "SBE",
  "DBE"
];

// List of available trades
export const TRADE_OPTIONS = [
  "Construction Manager",
  "General Contractor",
  "Division 02 — Site Works",
  "Division 03 — Concrete",
  "Division 04 — Masonry",
  "Division 05 — Metals",
  "Division 06 — Wood and Plastics",
  "Division 07 — Thermal and Moisture Protection",
  "Division 08 — Doors and Windows",
  "Division 09 — Finishes",
  "Division 10 — Specialties",
  "Division 11 — Equipment",
  "Division 12 — Furnishings",
  "Division 13 — Special Construction",
  "Division 14 — Conveying Systems",
  "Division 15 — Mechanical/Plumbing",
  "Division 16 — Electrical",
];

/**
 * Users Table
 * Stores both contractor and government organization profiles
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  companyWebsite: text("company_website"),    // Company website URL (optional)
  firstName: text("first_name"),              // Contact first name
  lastName: text("last_name"),                // Contact last name
  jobTitle: text("job_title"),                // Job title/position
  telephone: text("telephone"),                // Office phone
  cell: text("cell"),                         // Mobile phone
  isMinorityOwned: boolean("is_minority_owned").default(false),
  minorityGroup: text("minority_group"),       // Specific minority classification
  trade: text("trade"),                       // Primary trade/industry
  certificationName: text("certification_name").array(), // Business certifications
  logo: text("logo"),                         // Company logo URL
  onboardingComplete: boolean("onboarding_complete").default(false),
  status: text("status", { enum: ["active", "deactivated"] }).default("active"),
  language: text("language").default("en"),    // User language preference
  emailVerified: boolean("email_verified").default(false), // Whether email is verified
  verificationToken: text("verification_token"), // Email verification token
  verificationTokenExpiry: timestamp("verification_token_expiry"), // When the verification token expires
  resetToken: text("reset_token"),            // Password reset token
  resetTokenExpiry: timestamp("reset_token_expiry"), // When the reset token expires
  failedLoginAttempts: integer("failed_login_attempts").default(0), // Track failed login attempts
  accountLockedUntil: timestamp("account_locked_until"), // When the account lockout expires
});

/**
 * RFPs (Request for Proposals) Table
 * Core table for bid opportunities
 */
export const rfps = pgTable("rfps", {
  id: serial("id").primaryKey(),
  clientName: text("client_name"),                                // Client/organization name for RFP attribution
  title: text("title").notNull(),
  description: text("description").notNull(),
  walkthroughDate: timestamp("walkthrough_date").notNull(),  // Site visit date
  rfiDate: timestamp("rfi_date").notNull(),                  // Last day for questions
  deadline: timestamp("deadline").notNull(),                 // Bid submission deadline
  budgetMin: integer("budget_min"),                         // Minimum budget (optional)
  certificationGoals: text("certification_goals").array(),   // Required certifications
  desiredTrades: text("desired_trades").array(),            // Desired contractor trades
  jobStreet: text("job_street").notNull(),                 // Street address
  jobCity: text("job_city").notNull(),                     // City
  jobState: text("job_state").notNull(),                   // State
  jobZip: text("job_zip").notNull(),                       // ZIP code
  portfolioLink: text("portfolio_link"),                    // Additional resources
  mandatoryWalkthrough: boolean("mandatory_walkthrough").default(false), // Is walkthrough mandatory
  status: text("status", { enum: ["open", "closed"] }).default("open"),
  organizationId: integer("organization_id").references(() => users.id),
  featured: boolean("featured").default(false),             // Promoted/featured status
  featuredAt: timestamp("featured_at"),                    // When the RFP was featured
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * RFP Documents Table
 * Stores document attachments for RFPs (drawings, specifications, addenda)
 */
export const rfpDocuments = pgTable("rfp_documents", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id, { onDelete: 'cascade' }).notNull(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  documentType: text("document_type", { enum: ["drawing", "specification", "addendum"] }).notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

/**
 * RFP Analytics Table
 * Tracks engagement metrics for RFPs
 */
export const rfpAnalytics = pgTable("rfp_analytics", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id, { onDelete: 'cascade' }),
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
  rfpId: integer("rfp_id").references(() => rfps.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id),
  viewDate: timestamp("view_date").notNull(),
  duration: integer("duration").default(0),                 // Session duration (seconds)
  convertedToBid: boolean("converted_to_bid").default(false),
});

/**
 * RFIs (Request for Information) Table
 * Questions and clarifications for RFPs
 */
export const rfis = pgTable("rfis", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id, { onDelete: 'cascade' }),
  email: text("email").notNull(),                          // Requester's email
  message: text("message").notNull(),                      // Question/request
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status", { enum: ["pending", "responded"] }).default("pending"),
  // Note: organizationId field exists in the TypeScript schema but not in the actual database
  // If you need to add this field to the database, run a migration
});

/**
 * RFI Messages Table
 * Individual messages in RFI conversation threads
 */
export const rfiMessages = pgTable("rfi_messages", {
  id: serial("id").primaryKey(),
  rfiId: integer("rfi_id").references(() => rfis.id, { onDelete: 'cascade' }).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  message: text("message"), // Optional - can be null if message is attachment-only
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * RFI Attachments Table
 * File attachments for RFI messages
 */
export const rfiAttachments = pgTable("rfi_attachments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => rfiMessages.id, { onDelete: 'cascade' }).notNull(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(), // S3 URL or storage URL
  fileSize: integer("file_size"), // File size in bytes
  mimeType: text("mime_type"), // File MIME type
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

/**
 * Notifications Table
 * In-app notifications for users
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: ["rfi_response", "deadline_reminder", "system"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"), // ID of related entity (RFI, RFP, etc.)
  relatedType: text("related_type", { enum: ["rfi", "rfp"] }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  telephone: z.string().min(1, "Telephone number is required"),
  cell: z.string().min(1, "Cell phone number is required"),
  trade: z.string().min(1, "Trade is required"),
  certificationName: z.array(z.string()).optional(),
  logo: z.any().optional(),
});

// Secure password validation
const securePasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, "Password must contain at least one special character");

// User creation validation
export const insertUserSchema = createInsertSchema(users)
  .pick({
    email: true,
    password: true,
    companyName: true,
    companyWebsite: true,
  })
  .extend({
    password: securePasswordSchema,
    companyWebsite: z.string().optional().or(z.literal("")),
  });

// Password reset schema
export const passwordResetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// RFP creation validation
export const insertRfpSchema = createInsertSchema(rfps)
  .pick({
    clientName: true,
    title: true,
    description: true,
    walkthroughDate: true,
    rfiDate: true,
    deadline: true,
    budgetMin: true,
    certificationGoals: true,
    desiredTrades: true,
    jobStreet: true,
    jobCity: true,
    jobState: true,
    jobZip: true,
    portfolioLink: true,
    mandatoryWalkthrough: true,
    featured: true,
  })
  .extend({
    clientName: z.string().min(1, "Client name is required"),
    walkthroughDate: z.string(),
    rfiDate: z.string(),
    deadline: z.string(),
    budgetMin: z.number().min(0, "Minimum budget must be a positive number").nullish(),
    jobStreet: z.string().min(1, "Street address is required"),
    jobCity: z.string().min(1, "City is required"),
    jobState: z.string().min(1, "State is required"),
    jobZip: z.string().min(1, "ZIP code is required"),
    certificationGoals: z.array(z.string()).nullish(),
    desiredTrades: z.array(z.string()).nullish(),
    portfolioLink: z.string().nullish().or(z.literal("")),
    mandatoryWalkthrough: z.boolean().default(false),
    featured: z.boolean().default(false),
  });

// RFI creation validation - email is provided by backend from authenticated user
export const insertRfiSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

// RFI message creation validation
export const insertRfiMessageSchema = createInsertSchema(rfiMessages).pick({
  rfiId: true,
  senderId: true,
  message: true,
}).extend({
  message: z.string().optional(), // Allow optional message for file-only messages
});

// RFI attachment creation validation
export const insertRfiAttachmentSchema = createInsertSchema(rfiAttachments).pick({
  messageId: true,
  filename: true,
  fileUrl: true,
  fileSize: true,
  mimeType: true,
});

// Notification creation validation
export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  relatedId: true,
  relatedType: true,
});

// RFP document creation validation
export const insertRfpDocumentSchema = createInsertSchema(rfpDocuments).pick({
  rfpId: true,
  filename: true,
  fileUrl: true,
  documentType: true,
  fileSize: true,
  mimeType: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Rfp = typeof rfps.$inferSelect;
export type InsertRfp = z.infer<typeof insertRfpSchema>;
export type RfpDocument = typeof rfpDocuments.$inferSelect;
export type InsertRfpDocument = z.infer<typeof insertRfpDocumentSchema>;
export type RfpAnalytics = typeof rfpAnalytics.$inferSelect;
export type RfpViewSession = typeof rfpViewSessions.$inferSelect;
export type Rfi = typeof rfis.$inferSelect;
export type InsertRfi = z.infer<typeof insertRfiSchema>;
export type RfiMessage = typeof rfiMessages.$inferSelect;
export type InsertRfiMessage = z.infer<typeof insertRfiMessageSchema>;
export type RfiAttachment = typeof rfiAttachments.$inferSelect;
export type InsertRfiAttachment = z.infer<typeof insertRfiAttachmentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type BackupLog = typeof backupLogs.$inferSelect;
export type InsertBackupLog = typeof backupLogs.$inferInsert;