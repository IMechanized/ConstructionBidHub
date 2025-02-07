import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  userType: text("user_type", { enum: ["government", "contractor"] }).notNull(),
  email: text("email").notNull(),
  // New fields for contractor
  industry: text("industry"),
  yearlyRevenue: text("yearly_revenue"),
  // New fields for government
  department: text("department"),
  jurisdiction: text("jurisdiction"),
  // Track onboarding status
  onboardingComplete: boolean("onboarding_complete").default(false),
});

export const rfps = pgTable("rfps", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: integer("budget").notNull(),
  deadline: timestamp("deadline").notNull(),
  status: text("status", { enum: ["open", "closed"] }).default("open"),
  organizationId: integer("organization_id").references(() => users.id),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  contractorId: integer("contractor_id").references(() => users.id),
  amount: integer("amount").notNull(),
  proposal: text("proposal").notNull(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => users.id),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status", { enum: ["pending", "active"] }).default("pending"),
});

export const contractorOnboardingSchema = z.object({
  industry: z.string().min(1, "Industry is required"),
  yearlyRevenue: z.string().min(1, "Yearly revenue is required"),
});

export const governmentOnboardingSchema = z.object({
  department: z.string().min(1, "Department is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  companyName: true,
  userType: true,
  email: true,
});

export const insertRfpSchema = createInsertSchema(rfps)
  .pick({
    title: true,
    description: true,
    budget: true,
    deadline: true,
  })
  .extend({
    deadline: z.string(),
    budget: z.number().min(0, "Budget must be a positive number"),
  });

export const insertBidSchema = createInsertSchema(bids).pick({
  amount: true,
  proposal: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  email: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Rfp = typeof rfps.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type Employee = typeof employees.$inferSelect;