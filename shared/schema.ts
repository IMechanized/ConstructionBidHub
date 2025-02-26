import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  contact: text("contact"),
  telephone: text("telephone"),
  cell: text("cell"),
  businessEmail: text("business_email"),
  isMinorityOwned: boolean("is_minority_owned").default(false),
  minorityGroup: text("minority_group"),
  trade: text("trade"),
  certificationName: text("certification_name"),
  logo: text("logo"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  status: text("status", { enum: ["active", "deactivated"] }).default("active"),
});

export const rfps = pgTable("rfps", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  walkthroughDate: timestamp("walkthrough_date").notNull(),
  rfiDate: timestamp("rfi_date").notNull(),
  deadline: timestamp("deadline").notNull(),
  budgetMin: integer("budget_min"),
  certificationGoals: text("certification_goals"),
  jobLocation: text("job_location").notNull(),
  portfolioLink: text("portfolio_link"),
  status: text("status", { enum: ["open", "closed"] }).default("open"),
  organizationId: integer("organization_id").references(() => users.id),
  featured: boolean("featured").default(false),
});

export const rfpAnalytics = pgTable("rfp_analytics", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  date: date("date").notNull(),
  totalViews: integer("total_views").default(0),
  uniqueViews: integer("unique_views").default(0),
  averageViewTime: integer("average_view_time").default(0), 
  totalBids: integer("total_bids").default(0),
  clickThroughRate: integer("click_through_rate").default(0), 
});

export const rfpViewSessions = pgTable("rfp_view_sessions", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  userId: integer("user_id").references(() => users.id),
  viewDate: timestamp("view_date").notNull(),
  duration: integer("duration").default(0), 
  convertedToBid: boolean("converted_to_bid").default(false),
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

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  companyName: true,
});

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
export type InsertRfp = z.infer<typeof insertRfpSchema>;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type RfpAnalytics = typeof rfpAnalytics.$inferSelect;
export type RfpViewSession = typeof rfpViewSessions.$inferSelect;