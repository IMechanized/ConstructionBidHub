import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and, desc } from 'drizzle-orm';
import { pgTable, text, integer, boolean, timestamp, serial, date } from 'drizzle-orm/pg-core';
import createMemoryStore from 'memorystore';
import multer from 'multer';
import ws from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import Mailjet from 'node-mailjet';

/**
 * Stripe Payment Processing Integration
 * Enhanced implementation with better error handling and development support
 */

// Set the price for a featured RFP in cents ($25.00)
const FEATURED_RFP_PRICE = 2500;

// Get Stripe secret key from environment variables with multiple fallback options
const possibleSecretKeys = [
  process.env.STRIPE_SECRET_KEY,       // Primary key name
  process.env.STRIPE_SK,               // Short form
  process.env.STRIPE_API_KEY,          // Another common name
  process.env.STRIPE_KEY                // Shortest form
];

// Use the first valid key found (must start with sk_)
const stripeSecretKey = possibleSecretKeys.find(key => key && typeof key === 'string' && key.startsWith('sk_'));
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Stripe with proper error handling
let stripe = null;
let stripeStatus = {
  isInitialized: false,
  mode: process.env.NODE_ENV || 'development',
  keyType: 'none'
};

try {
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
      appInfo: {
        name: 'FindConstructionBids',
        version: '1.0.0'
      }
    });

    stripeStatus = {
      isInitialized: true,
      mode: process.env.NODE_ENV || 'development',
      keyType: stripeSecretKey.startsWith('sk_test_') ? 'test' : 'live'
    };

    console.log(`✅ Stripe payment processing initialized successfully (${stripeStatus.keyType} mode)`);
  } else {
    console.warn('⚠️ No valid Stripe secret key found - payment features will use mock implementations');
  }
} catch (error) {
  console.error(`❌ Failed to initialize Stripe: ${error.message}`);
}

// Safe logging utilities for authentication (Vercel deployment version matching server/lib/safe-logging.ts)
const SENSITIVE_FIELDS = [
  'password', 'confirmPassword', 'currentPassword', 'newPassword',
  'client_secret', 'clientSecret',
  'token', 'accessToken', 'refreshToken', 'apiKey', 'api_key',
  'secret', 'privateKey', 'private_key',
  'authorization', 'set-cookie', 'cookie', 'session', 'csrf',
  'id_token', 'refresh_token', 'access_token',
  'creditCard', 'ssn', 'socialSecurityNumber',
  'verificationToken', 'resetToken'
];

const MASKABLE_FIELDS = ['email', 'username', 'phoneNumber', 'phone'];

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[invalid_email]';
  const [username, domain] = email.split('@');
  if (!username || !domain) return '[invalid_email]';
  if (username.length <= 1) return `${username}***@${domain}`;
  return `${username[0]}***@${domain}`;
}

function maskString(value, showStart = 1, showEnd = 0) {
  if (!value || typeof value !== 'string') return '[redacted]';
  if (value.length <= showStart + showEnd) return '[redacted]';
  const start = value.substring(0, showStart);
  const end = showEnd > 0 ? value.substring(value.length - showEnd) : '';
  const middle = '*'.repeat(Math.max(3, value.length - showStart - showEnd));
  return start + middle + end;
}

function sanitizeObject(obj, depth = 0) {
  if (depth > 10) return '[max_depth_reached]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      // Completely redact sensitive fields
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
      // Mask email-like and other maskable fields
      else if (MASKABLE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        if (typeof value === 'string' && value.includes('@')) {
          sanitized[key] = maskEmail(value);
        } else if (typeof value === 'string') {
          sanitized[key] = maskString(value, 2, 0);
        } else {
          sanitized[key] = sanitizeObject(value, depth + 1);
        }
      }
      // Recursively sanitize nested objects
      else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }
  return obj;
}

function safeLog(message, data) {
  if (data !== undefined) {
    console.log(message, sanitizeObject(data));
  } else {
    console.log(message);
  }
}

function safeError(message, error) {
  if (error !== undefined) {
    if (error instanceof Error) {
      const sanitizedError = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...sanitizeObject({ ...error })
      };
      console.error(message, sanitizedError);
    } else {
      console.error(message, sanitizeObject(error));
    }
  } else {
    console.error(message);
  }
}

// Error sanitization utilities (matching server/lib/error-handler.ts for Vercel deployment)
const isDevelopmentMode = process.env.NODE_ENV === 'development' || process.env.DEV === 'true';

const ErrorMessages = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INTERNAL_ERROR: 'An internal error occurred',
  BAD_REQUEST: 'Invalid request',
  NOT_FOUND: 'Resource not found',
  UPLOAD_FAILED: 'Failed to upload file',
  FETCH_FAILED: 'Failed to retrieve data',
  CREATE_FAILED: 'Failed to create resource',
  UPDATE_FAILED: 'Failed to update resource',
  DELETE_FAILED: 'Failed to delete resource',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input provided',
};

function sanitizeError(error, fallbackMessage = 'An error occurred') {
  if (isDevelopmentMode) {
    // Development: Return error message and stack only (no raw error object)
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack
      };
    }
    return {
      message: String(error || fallbackMessage)
    };
  }
  
  // Production: Return ONLY the generic message, nothing else
  return {
    message: fallbackMessage
  };
}

// Sensitive field names that should be redacted from logs
const SENSITIVE_LOG_FIELDS = [
  'password', 'secret', 'token', 'key', 'authorization',
  'cookie', 'session', 'credential', 'apikey', 'api_key',
  'private', 'ssn', 'creditcard', 'cvv'
];

// Deep sanitize object for logging - redacts sensitive fields
function deepSanitize(obj, depth = 0) {
  if (depth > 5) return '[max_depth]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, depth + 1));
  }
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_LOG_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = deepSanitize(value, depth + 1);
      }
    }
    return sanitized;
  }
  return String(obj);
}

function sanitizeForLogging(error) {
  if (error instanceof Error) {
    // For Error objects: extract only safe fields and sanitize any custom properties
    const baseError = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
    
    // If Error has custom enumerable properties, sanitize them
    const customProps = {};
    for (const key of Object.keys(error)) {
      if (!['name', 'message', 'stack'].includes(key)) {
        customProps[key] = deepSanitize(error[key]);
      }
    }
    
    return Object.keys(customProps).length > 0 
      ? { ...baseError, ...customProps }
      : baseError;
  }
  
  // For non-Error objects: deep sanitize to remove sensitive fields
  return deepSanitize(error);
}

function sendErrorResponse(res, error, statusCode, userMessage, logContext) {
  // Log sanitized error server-side (no raw error objects)
  const context = logContext ? `[${logContext}]` : '';
  const safeError = sanitizeForLogging(error);
  console.error(`${context} Error:`, safeError);
  
  const sanitized = sanitizeError(error, userMessage);
  res.status(statusCode).json(sanitized);
}

function isValidationError(error) {
  if (error instanceof Error) {
    const safePatterns = [
      /required/i,
      /invalid/i,
      /must be/i,
      /cannot be/i,
      /already exists/i,
    ];
    return safePatterns.some(pattern => pattern.test(error.message));
  }
  return false;
}

function getSafeValidationMessage(error) {
  if (isDevelopmentMode) {
    return error instanceof Error ? error.message : ErrorMessages.VALIDATION_FAILED;
  }
  
  if (isValidationError(error) && error instanceof Error) {
    return error.message;
  }
  
  return ErrorMessages.VALIDATION_FAILED;
}

// Rate limiter for authentication endpoints to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    safeLog(`[Security] Rate limit exceeded for login from IP: ${req.ip}`);
    res.status(429).json({ 
      message: "Too many login attempts from this IP, please try again after 15 minutes" 
    });
  },
});

// Password hashing and comparison utilities
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  // Guard against null, undefined, or improperly formatted passwords
  if (!stored || typeof stored !== 'string' || !stored.includes('.')) {
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    // Handle any errors in password comparison (e.g., invalid hex)
    safeError('Password comparison error:', error);
    return false;
  }
}

// Rate limiter for registration endpoint
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration requests per hour
  message: "Too many accounts created from this IP, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    safeLog(`[Security] Rate limit exceeded for registration from IP: ${req.ip}`);
    res.status(429).json({ 
      message: "Too many accounts created from this IP, please try again after an hour" 
    });
  },
});

// Configure WebSocket for Neon
if (ws) {
  neonConfig.webSocketConstructor = ws;
}

// Initialize database connection
const getDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return process.env.DATABASE_URL;
};

const pool = new Pool({ 
  connectionString: getDatabaseUrl(),
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: true,
  },
  keepAlive: true,
  retryDelay: 1000,
  retryCount: 3
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Define schema matching shared/schema.ts
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  jobTitle: text("job_title"),
  telephone: text("telephone"),
  cell: text("cell"),
  isMinorityOwned: boolean("is_minority_owned").default(false),
  minorityGroup: text("minority_group"),
  trade: text("trade"),
  certificationName: text("certification_name").array(),
  logo: text("logo"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  status: text("status").default("active"),
  language: text("language").default("en"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  accountLockedUntil: timestamp("account_locked_until"),
});

const rfps = pgTable("rfps", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  walkthroughDate: timestamp("walkthrough_date").notNull(),
  rfiDate: timestamp("rfi_date").notNull(),
  deadline: timestamp("deadline").notNull(),
  budgetMin: integer("budget_min"),
  certificationGoals: text("certification_goals").array(),
  jobStreet: text("job_street").notNull(),
  jobCity: text("job_city").notNull(),
  jobState: text("job_state").notNull(),
  jobZip: text("job_zip").notNull(),
  portfolioLink: text("portfolio_link"),
  status: text("status").default("open"),
  organizationId: integer("organization_id").references(() => users.id),
  featured: boolean("featured").default(false),
  featuredAt: timestamp("featured_at"),
  createdAt: timestamp("created_at"),
});

const rfis = pgTable("rfis", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at"),
  status: text("status").default("pending"),
});

const rfiMessages = pgTable("rfi_messages", {
  id: serial("id").primaryKey(),
  rfiId: integer("rfi_id").references(() => rfis.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at"),
});

const rfiAttachments = pgTable("rfi_attachments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => rfiMessages.id).notNull(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at"),
});

const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"),
  relatedType: text("related_type"),
  createdAt: timestamp("created_at"),
});

const rfpAnalytics = pgTable("rfp_analytics", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  date: date("date").notNull(),
  totalViews: integer("total_views").default(0),
  uniqueViews: integer("unique_views").default(0),
  averageViewTime: integer("average_view_time").default(0),
  totalBids: integer("total_bids").default(0),
  clickThroughRate: integer("click_through_rate").default(0),
});

const rfpViewSessions = pgTable("rfp_view_sessions", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  userId: integer("user_id").references(() => users.id),
  viewDate: timestamp("view_date").notNull(),
  duration: integer("duration").default(0),
  convertedToBid: boolean("converted_to_bid").default(false),
});

// Initialize Drizzle ORM
const db = drizzle(pool);

// Validation Schemas
const securePasswordSchema = z.string()
  .min(7, "Password must be at least 7 characters long")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, "Password must contain at least one special character");

const insertUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: securePasswordSchema,
  companyName: z.string().min(1, "Company name is required"),
});

const passwordResetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Token utilities
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

function generateToken() {
  return randomBytes(32).toString("hex");
}

async function createVerificationToken(userId) {
  const token = generateToken();
  const expiryDate = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);
  
  await storage.updateUser(userId, {
    verificationToken: token,
    verificationTokenExpiry: expiryDate,
  });
  
  return token;
}

async function createPasswordResetToken(userId) {
  const token = generateToken();
  const expiryDate = new Date(Date.now() + RESET_TOKEN_EXPIRY);
  
  await storage.updateUser(userId, {
    resetToken: token,
    resetTokenExpiry: expiryDate,
  });
  
  return token;
}

async function verifyEmailToken(token) {
  const user = await storage.getUserByVerificationToken(token);
  
  if (!user) {
    return null;
  }
  
  const tokenExpiry = user.verificationTokenExpiry;
  if (!tokenExpiry || new Date(tokenExpiry) < new Date()) {
    return null;
  }
  
  await storage.updateUser(user.id, {
    emailVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  });
  
  return user.id;
}

async function verifyPasswordResetToken(token) {
  const user = await storage.getUserByResetToken(token);
  
  if (!user) {
    return null;
  }
  
  const tokenExpiry = user.resetTokenExpiry;
  if (!tokenExpiry || new Date(tokenExpiry) < new Date()) {
    return null;
  }
  
  return user.id;
}

async function consumePasswordResetToken(userId) {
  await storage.updateUser(userId, {
    resetToken: null,
    resetTokenExpiry: null,
  });
}

// Email utilities
const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY || '',
  apiSecret: process.env.MAILJET_SECRET_KEY || '',
});

function stripHtml(html) {
  return html.replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendEmail(params) {
  try {
    const { to, subject, htmlContent, textContent, fromEmail, fromName } = params;
    
    const request = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: fromEmail || 'noreply@findconstructionbids.com',
            Name: fromName || 'FindConstructionBids',
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
          TextPart: textContent || stripHtml(htmlContent),
          HTMLPart: htmlContent,
        },
      ],
    });
    
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

async function sendVerificationEmail(email, token, companyName) {
  const verificationUrl = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to FindConstructionBids!</h2>
      <p>Hello ${companyName},</p>
      <p>Thank you for registering with FindConstructionBids. To complete your registration and verify your email address, please click the button below:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${verificationUrl}" style="background-color: #4a7aff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
      </p>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This verification link will expire in 24 hours.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
      <p>Best regards,<br>The FindConstructionBids Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address - FindConstructionBids',
    htmlContent,
  });
}

async function sendPasswordResetEmail(email, token, companyName) {
  const resetUrl = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hello ${companyName},</p>
      <p>We received a request to reset your password for your FindConstructionBids account. To proceed with resetting your password, please click the button below:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #4a7aff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </p>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This password reset link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      <p>Best regards,<br>The FindConstructionBids Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - FindConstructionBids',
    htmlContent,
  });
}

// Storage implementation
const storage = {
  async getUser(id) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async updateUser(id, updates) {
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
          isMinorityOwned: updates.isMinorityOwned,
          minorityGroup: updates.minorityGroup,
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
  },

  async getUserByUsername(email) {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return null;
    }
  },

  async getRfps() {
    try {
      return await db.select().from(rfps);
    } catch (error) {
      console.error("Error getting RFPs:", error);
      return [];
    }
  },

  async getRfpById(id) {
    try {
      const [rfp] = await db.select().from(rfps).where(eq(rfps.id, id));
      return rfp;
    } catch (error) {
      console.error("Error getting RFP by ID:", error);
      return null;
    }
  },

  async getFeaturedRfps() {
    try {
      return await db.select()
        .from(rfps)
        .where(eq(rfps.featured, true));
    } catch (error) {
      console.error("Error getting featured RFPs:", error);
      return [];
    }
  },

  async createRfp(data) {
    try {
      const [rfp] = await db.insert(rfps).values(data).returning();
      return rfp;
    } catch (error) {
      console.error("Error creating RFP:", error);
      throw error;
    }
  },

  async updateRfp(id, data) {
    try {
      const [updated] = await db
        .update(rfps)
        .set(data)
        .where(eq(rfps.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating RFP:", error);
      throw error;
    }
  },

  async deleteRfp(id) {
    try {
      await db.delete(rfps).where(eq(rfps.id, id));
    } catch (error) {
      console.error("Error deleting RFP:", error);
      throw error;
    }
  },

  async getRfisByRfp(rfpId) {
    try {
      return await db.select().from(rfis).where(eq(rfis.rfpId, rfpId));
    } catch (error) {
      console.error("Error getting RFIs by RFP:", error);
      return [];
    }
  },

  async getRfisByEmail(email) {
    try {
      return await db.select().from(rfis).where(eq(rfis.email, email));
    } catch (error) {
      console.error("Error getting RFIs by email:", error);
      return [];
    }
  },

  async createRfi(data) {
    try {
      const [rfi] = await db.insert(rfis).values(data).returning();
      return rfi;
    } catch (error) {
      console.error("Error creating RFI:", error);
      throw error;
    }
  },

  async updateRfiStatus(rfiId, status) {
    try {
      const [updated] = await db
        .update(rfis)
        .set({ status })
        .where(eq(rfis.id, rfiId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating RFI status:", error);
      throw error;
    }
  },

  async deleteRfi(rfiId) {
    try {
      await db.delete(rfis).where(eq(rfis.id, rfiId));
    } catch (error) {
      console.error("Error deleting RFI:", error);
      throw error;
    }
  },

  async getAnalyticsByRfpId(rfpId) {
    try {
      // Format today's date properly for SQL
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Get analytics for the specific date
      const [analytics] = await db.select()
        .from(rfpAnalytics)
        .where(
          and(
            eq(rfpAnalytics.rfpId, rfpId),
            eq(rfpAnalytics.date, formattedDate)
          )
        );
      
      if (!analytics) {
        // If no analytics found for today, create a default analytics object
        // This avoids undefined errors when spreading the analytics object
        return {
          id: -1, // Placeholder ID
          rfpId: rfpId,
          date: formattedDate,
          totalViews: 0,
          uniqueViews: 0,
          averageViewTime: 0,
          totalBids: 0,
          clickThroughRate: 0
        };
      }
      
      return analytics;
    } catch (error) {
      console.error("Error getting analytics by RFP ID:", error);
      // Return default structure to avoid null errors
      return {
        id: -1,
        rfpId: rfpId,
        totalViews: 0, 
        uniqueViews: 0,
        averageViewTime: 0,
        totalBids: 0,
        clickThroughRate: 0
      };
    }
  },

  async getBoostedAnalytics(userId) {
    try {
      console.log(`Getting boosted analytics for user ${userId}`);
      
      // Get featured RFPs owned by this user
      const featuredRfps = await db.select().from(rfps)
        .where(and(
          eq(rfps.organizationId, userId),
          eq(rfps.featured, true)
        ));
      
      console.log(`Found ${featuredRfps.length} featured RFPs for user ${userId}`);
      
      if (featuredRfps.length === 0) {
        return []; // No featured RFPs, return empty array
      }

      // For each featured RFP, get or create analytics
      const analyticsWithRfps = await Promise.all(
        featuredRfps.map(async (rfp) => {
          try {
            // Get analytics, which will now be properly filtered by date
            // or return a default object if none exists
            const analytics = await this.getAnalyticsByRfpId(rfp.id);
            
            // Return combined data
            return {
              ...analytics,
              rfp
            };
          } catch (err) {
            console.error(`Error processing analytics for RFP ${rfp.id}:`, err);
            // Return a default object with the RFP to prevent the entire array from failing
            return {
              id: -1,
              rfpId: rfp.id,
              totalViews: 0,
              uniqueViews: 0,
              averageViewTime: 0,
              totalBids: 0,
              clickThroughRate: 0,
              rfp
            };
          }
        })
      );

      console.log(`Successfully processed ${analyticsWithRfps.length} analytics records`);
      return analyticsWithRfps;
    } catch (error) {
      console.error("Error getting boosted analytics:", error);
      return [];
    }
  },

  // RFI Conversation Operations
  async createRfiMessage(message) {
    try {
      const [newMessage] = await db
        .insert(rfiMessages)
        .values(message)
        .returning();
      return newMessage;
    } catch (error) {
      console.error("Error creating RFI message:", error);
      throw error;
    }
  },

  async getRfiMessages(rfiId) {
    try {
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
    } catch (error) {
      console.error("Error getting RFI messages:", error);
      return [];
    }
  },

  async getRfiMessageById(messageId) {
    try {
      const [message] = await db
        .select()
        .from(rfiMessages)
        .where(eq(rfiMessages.id, messageId));
      return message;
    } catch (error) {
      console.error("Error getting RFI message by ID:", error);
      return null;
    }
  },

  async createRfiAttachment(attachment) {
    try {
      const [newAttachment] = await db
        .insert(rfiAttachments)
        .values(attachment)
        .returning();
      return newAttachment;
    } catch (error) {
      console.error("Error creating RFI attachment:", error);
      throw error;
    }
  },

  async getRfiAttachmentById(attachmentId) {
    try {
      const [attachment] = await db
        .select()
        .from(rfiAttachments)
        .where(eq(rfiAttachments.id, attachmentId));
      return attachment;
    } catch (error) {
      console.error("Error getting RFI attachment by ID:", error);
      return null;
    }
  },

  async getRfiAttachments(messageId) {
    try {
      return await db
        .select()
        .from(rfiAttachments)
        .where(eq(rfiAttachments.messageId, messageId))
        .orderBy(rfiAttachments.uploadedAt);
    } catch (error) {
      console.error("Error getting RFI attachments:", error);
      return [];
    }
  },

  // Notification Operations
  async createNotification(notification) {
    try {
      const [newNotification] = await db
        .insert(notifications)
        .values(notification)
        .returning();
      return newNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  async getNotificationsByUser(userId) {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error("Error getting notifications by user:", error);
      return [];
    }
  },

  async markNotificationAsRead(id) {
    try {
      const [updated] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
      if (!updated) throw new Error("Notification not found");
      return updated;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  async markAllNotificationsAsRead(userId) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  async deleteNotification(id) {
    try {
      await db.delete(notifications).where(eq(notifications.id, id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },

  async createUser(data) {
    try {
      const [user] = await db.insert(users).values(data).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async getUserByVerificationToken(token) {
    try {
      const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
      return user;
    } catch (error) {
      console.error("Error getting user by verification token:", error);
      return null;
    }
  },

  async getUserByResetToken(token) {
    try {
      const [user] = await db.select().from(users).where(eq(users.resetToken, token));
      return user;
    } catch (error) {
      console.error("Error getting user by reset token:", error);
      return null;
    }
  },

  get sessionStore() {
    const MemoryStore = createMemoryStore(session);
    return new MemoryStore({
      checkPeriod: 86400000
    });
  }
};

// Configure multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  }
});

// Route parameter validation utilities (inline for Vercel self-contained deployment)
function validatePositiveInt(paramValue, paramName, res) {
  if (!paramValue) {
    sendErrorResponse(res, new Error(`Missing ${paramName}`), 400, ErrorMessages.BAD_REQUEST, 'ParamValidation');
    return null;
  }

  // Check if it's a positive integer string
  if (!/^\d+$/.test(paramValue)) {
    sendErrorResponse(res, new Error(`Invalid ${paramName}`), 400, ErrorMessages.BAD_REQUEST, 'ParamValidation');
    return null;
  }

  const num = Number(paramValue);
  if (!Number.isInteger(num) || num <= 0) {
    sendErrorResponse(res, new Error(`Invalid ${paramName}`), 400, ErrorMessages.BAD_REQUEST, 'ParamValidation');
    return null;
  }

  return num;
}

function validateRouteParams(req, res, params) {
  const validated = {};

  for (const [paramName, type] of Object.entries(params)) {
    const paramValue = req.params[paramName];

    if (!paramValue) {
      sendErrorResponse(res, new Error(`Missing ${paramName}`), 400, ErrorMessages.BAD_REQUEST, 'ParamValidation');
      return null;
    }

    if (type === 'positiveInt') {
      if (!/^\d+$/.test(paramValue)) {
        sendErrorResponse(res, new Error(`Invalid ${paramName}`), 400, ErrorMessages.BAD_REQUEST, 'ParamValidation');
        return null;
      }

      const num = Number(paramValue);
      if (!Number.isInteger(num) || num <= 0) {
        sendErrorResponse(res, new Error(`Invalid ${paramName}`), 400, ErrorMessages.BAD_REQUEST, 'ParamValidation');
        return null;
      }

      validated[paramName] = num;
    } else {
      sendErrorResponse(res, new Error(`Unknown validation type: ${type}`), 400, ErrorMessages.BAD_REQUEST, 'ParamValidation');
      return null;
    }
  }

  return validated;
}

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", "'unsafe-inline'", "'unsafe-eval'",
        "https://js.stripe.com",
        "https://maps.googleapis.com",
        "https://*.googleapis.com"
      ],
      styleSrc: [
        "'self'", "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://maps.gstatic.com"
      ],
      imgSrc: [
        "'self'", "data:", "https:", "blob:",
        "https://maps.gstatic.com",
        "https://maps.googleapis.com",
        "https://*.google.com",
        "https://res.cloudinary.com",
        "https://*.cloudinary.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://maps.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://m.stripe.network",
        "https://maps.googleapis.com",
        "https://*.googleapis.com",
        "https://*.google.com",
        "https://api.cloudinary.com",
        "https://res.cloudinary.com",
        "https://*.cloudinary.com"
      ],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Set up session - matches server/session.ts configuration
console.log('[Session] Initializing session configuration...');

const sessionConfig = {
  secret: process.env.SESSION_SECRET || process.env.REPL_ID || 'development_secret',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours - consistent timeout
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax' // Use lax for better compatibility
  }
};

// Handle production-specific settings
if (process.env.NODE_ENV === 'production') {
  console.log('[Session] Configuring for production environment');
  
  // Trust the proxy in production environments like Vercel
  app.set('trust proxy', 1);
  
  // Set secure flag for HTTPS
  sessionConfig.cookie.secure = true;
  
  // Log Vercel URL if detected
  if (process.env.VERCEL_URL) {
    console.log(`[Session] Detected Vercel deployment URL: ${process.env.VERCEL_URL}`);
  }
} else {
  console.log('[Session] Configuring for development environment');
}

// Log session configuration for debugging
console.log('[Session] Configuration:', {
  maxAge: sessionConfig.cookie?.maxAge,
  secure: sessionConfig.cookie?.secure,
  sameSite: sessionConfig.cookie?.sameSite,
  httpOnly: sessionConfig.cookie?.httpOnly
});

// Enable CORS with credentials
// CORS configuration with secure origin whitelist
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      process.env.ALLOWED_ORIGIN,
      process.env.FRONTEND_URL
    ].filter(Boolean)
  : ['http://localhost:5000', 'http://localhost:5001', 'http://localhost:3000', 'http://127.0.0.1:5000'];

safeLog('[CORS] Allowed origins configured:', { origins: allowedOrigins, environment: process.env.NODE_ENV });

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (origin) {
    safeLog(`[Security] CORS blocked request from origin: ${origin}`);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(session(sessionConfig));

// Set up authentication
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        safeLog(`[Auth] Login attempt with email: ${maskEmail(email)}`);
        let user = await storage.getUserByUsername(email);
        
        if (!user) {
          safeLog(`[Auth] No user found for email: ${maskEmail(email)}`);
          return done(null, false, { message: "Invalid email or password" });
        }
        
        if (user.status === 'deactivated') {
          safeLog(`[Auth] Account deactivated for email: ${maskEmail(email)}`);
          return done(null, false, { message: "Account is deactivated" });
        }

        // Check if account is locked
        if (user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date()) {
          const lockMinutesRemaining = Math.ceil((new Date(user.accountLockedUntil).getTime() - Date.now()) / 60000);
          safeLog(`[Auth] Account locked for user: ${maskEmail(email)}, ${lockMinutesRemaining} minutes remaining`);
          return done(null, false, { 
            message: `Account is locked due to too many failed login attempts. Please try again in ${lockMinutesRemaining} minute${lockMinutesRemaining !== 1 ? 's' : ''}.` 
          });
        }
        
        safeLog('[Auth] User found, verifying password');
        const isValidPassword = await comparePasswords(password, user.password);
        
        if (!isValidPassword) {
          // Increment failed attempts
          const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
          const MAX_FAILED_ATTEMPTS = 5;
          const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

          if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
            // Lock account
            const accountLockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
            const updatedUser = await storage.updateUser(user.id, {
              failedLoginAttempts: newFailedAttempts,
              accountLockedUntil
            });
            
            safeLog(`[Auth] Account locked for user: ${maskEmail(email)} after ${newFailedAttempts} failed attempts`);
            return done(null, false, { 
              message: "Account has been locked due to too many failed login attempts. Please try again in 15 minutes." 
            });
          } else {
            // Update failed attempts
            const updatedUser = await storage.updateUser(user.id, {
              failedLoginAttempts: newFailedAttempts
            });
            
            safeLog(`[Auth] Invalid password for email: ${maskEmail(email)}, attempt ${newFailedAttempts} of ${MAX_FAILED_ATTEMPTS}`);
            const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
            return done(null, false, { 
              message: `Invalid email or password. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining before account lockout.` 
            });
          }
        }

        // Successful login - clear failed attempts and lockout
        if (user.failedLoginAttempts || user.accountLockedUntil) {
          const updatedUser = await storage.updateUser(user.id, {
            failedLoginAttempts: 0,
            accountLockedUntil: null
          });
          // Use the updated user for the session
          user = updatedUser;
        }
        
        safeLog(`[Auth] Login successful for email: ${maskEmail(email)}`);
        return done(null, user);
      } catch (error) {
        safeError(`[Auth] Error during authentication:`, error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  safeLog(`[Auth] Serializing user: ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    safeLog(`[Auth] Deserializing user: ${id}`);
    const user = await storage.getUser(id);
    if (!user) {
      safeLog(`[Auth] No user found during deserialization for id: ${id}`);
      return done(null, false);
    }
    safeLog(`[Auth] User deserialized successfully: ${id}`);
    done(null, user);
  } catch (error) {
    safeError(`[Auth] Error during deserialization:`, error);
    done(error);
  }
});

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }
  next();
}

// Ensure all protected routes use requireAuth
app.use([
  '/api/rfps/create',
  '/api/rfps/edit',
  '/api/rfps/delete',
  '/api/rfis',
  '/api/analytics',
  '/api/user/settings',
  '/api/user/onboarding',
  // Payment and Stripe routes
  '/api/payments/create-payment-intent',
  '/api/payments/confirm-payment',
  '/api/payments/status',
  '/api/stripe'  // For any other potential Stripe routes
], requireAuth);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Authentication status endpoints (support both paths for compatibility)
app.get('/api/health/auth-status', (req, res) => {
  res.json({ 
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user.id,
      email: req.user.email,
      companyName: req.user.companyName
    } : null
  });
});

// The endpoint path being requested in logs
app.get('/api/auth-status', (req, res) => {
  res.json({ 
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user.id,
      email: req.user.email,
      companyName: req.user.companyName
    } : null
  });
});

// RFP routes
app.get("/api/rfps", async (req, res) => {
  const rfps = await storage.getRfps();
  const rfpsWithOrgs = await Promise.all(
    rfps.map(async (rfp) => {
      if (rfp.organizationId === null) {
        return { ...rfp, organization: null };
      }
      const org = await storage.getUser(rfp.organizationId);
      return {
        ...rfp,
        organization: org ? {
          id: org.id,
          companyName: org.companyName,
          logo: org.logo
        } : null
      };
    })
  );
  res.json(rfpsWithOrgs);
});

app.get("/api/rfps/featured", async (req, res) => {
  try {
    const featuredRfps = await storage.getFeaturedRfps();
    const rfpsWithOrgs = await Promise.all(
      featuredRfps.map(async (rfp) => {
        if (rfp.organizationId === null) {
          return { ...rfp, organization: null };
        }
        const org = await storage.getUser(rfp.organizationId);
        return {
          ...rfp,
          organization: org ? {
            id: org.id,
            companyName: org.companyName,
            logo: org.logo
          } : null
        };
      })
    );
    res.json(rfpsWithOrgs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch featured RFPs" });
  }
});

app.get("/api/rfps/:id", async (req, res) => {
  try {
    const id = validatePositiveInt(req.params.id, 'RFP ID', res);
    if (id === null) return;

    const rfp = await storage.getRfpById(id);
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    if (rfp.organizationId === null) {
      return res.json({ ...rfp, organization: null });
    }
    const org = await storage.getUser(rfp.organizationId);
    const rfpWithOrg = {
      ...rfp,
      organization: org ? {
        id: org.id,
        companyName: org.companyName,
        logo: org.logo
      } : null
    };
    res.json(rfpWithOrg);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch RFP" });
  }
});

app.post("/api/rfps", requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    console.log('RFP creation request received:', req.body);

    // Convert string dates to Date objects
    const rfp = await storage.createRfp({
      ...req.body,
      walkthroughDate: new Date(req.body.walkthroughDate),
      rfiDate: new Date(req.body.rfiDate),
      deadline: new Date(req.body.deadline),
      organizationId: req.user.id,
      createdAt: new Date()
    });

    res.status(201).json(rfp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/rfps/:id", requireAuth, async (req, res) => {
  try {
    const id = validatePositiveInt(req.params.id, 'RFP ID', res);
    if (id === null) return;

    const rfp = await storage.getRfpById(id);
    if (!rfp || rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Convert date strings to Date objects
    const processedData = {
      ...req.body,
      walkthroughDate: req.body.walkthroughDate ? new Date(req.body.walkthroughDate) : undefined,
      rfiDate: req.body.rfiDate ? new Date(req.body.rfiDate) : undefined,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined
    };

    const updated = await storage.updateRfp(id, processedData);
    res.json(updated);
  } catch (error) {
    console.error('Error updating RFP:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/rfps/:id", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const id = validatePositiveInt(req.params.id, 'RFP ID', res);
    if (id === null) return;

    const rfp = await storage.getRfpById(id);
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own RFPs" });
    }

    await storage.deleteRfp(id);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting RFP:', error);
    res.status(500).json({ message: error.message || "Failed to delete RFP" });
  }
});

// RFI routes
app.post("/api/rfps/:id/rfi", requireAuth, async (req, res) => {
  try {
    const id = validatePositiveInt(req.params.id, 'RFP ID', res);
    if (id === null) return;

    const rfp = await storage.getRfpById(id);
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    const rfi = await storage.createRfi({
      ...req.body,
      email: req.user.email,
      rfpId: id,
    });

    res.status(201).json({
      message: "Request for information submitted successfully",
      rfi
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/rfps/:id/rfi", async (req, res) => {
  try {
    const id = validatePositiveInt(req.params.id, 'RFP ID', res);
    if (id === null) return;

    // First get all RFIs for this RFP
    const rfis = await storage.getRfisByRfp(id);

    // Then for each RFI, get the full user data
    const rfisWithOrgs = await Promise.all(
      rfis.map(async (rfi) => {
        const user = await storage.getUserByUsername(rfi.email);
        return {
          ...rfi,
          organization: user ? {
            id: user.id,
            companyName: user.companyName,
            logo: user.logo,
            contact: user.contact,
            telephone: user.telephone,
            cell: user.cell,
            businessEmail: user.businessEmail,
            certificationName: user.certificationName || [],
            trade: user.trade
          } : null
        };
      })
    );

    res.json(rfisWithOrgs);
  } catch (error) {
    console.error('Error fetching RFIs for RFP:', error);
    res.status(500).json({ message: "Failed to fetch RFIs" });
  }
});

app.get("/api/rfis", requireAuth, async (req, res) => {
  try {
    const userRfis = await storage.getRfisByEmail(req.user.email);
    const rfisWithRfp = await Promise.all(
      userRfis.map(async (rfi) => {
        if (rfi.rfpId === null) {
          return { ...rfi, rfp: null };
        }
        const rfp = await storage.getRfpById(rfi.rfpId);
        return { ...rfi, rfp };
      })
    );
    res.json(rfisWithRfp);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch RFIs" });
  }
});

app.put("/api/rfps/:rfpId/rfi/:rfiId/status", requireAuth, async (req, res) => {
  try {
    const params = validateRouteParams(req, res, { rfpId: 'positiveInt', rfiId: 'positiveInt' });
    if (!params) return;

    const rfpId = params.rfpId;
    const rfiId = params.rfiId;
    const { status } = req.body;

    const rfp = await storage.getRfpById(rfpId);
    if (!rfp || rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this RFI" });
    }

    const updatedRfi = await storage.updateRfiStatus(rfiId, status);
    res.json(updatedRfi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Analytics routes
app.get("/api/analytics/boosted", requireAuth, async (req, res) => {
  try {
    const analytics = await storage.getBoostedAnalytics(req.user.id);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

app.post("/api/analytics/track-view", requireAuth, async (req, res) => {
  try {
    const { rfpId, duration } = req.body;

    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    if (rfp.organizationId === req.user.id) {
      return res.status(200).json({ skipped: true, message: "Self-view not tracked" });
    }

    const today = new Date().toISOString().split('T')[0];
    const viewSession = await db
      .insert(rfpViewSessions)
      .values({
        rfpId,
        userId: req.user.id,
        viewDate: new Date(),
        duration,
      })
      .returning();

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
      const totalViews = (existingAnalytics.totalViews || 0) + 1;
      const uniqueViews = (existingAnalytics.uniqueViews || 0) + 1;
      const averageViewTime = Math.round(
        (((existingAnalytics.averageViewTime || 0) * (existingAnalytics.totalViews || 0)) + duration) / totalViews
      );

      await db
        .update(rfpAnalytics)
        .set({
          totalViews,
          uniqueViews,
          averageViewTime,
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

    res.json({ success: true, viewSession });
  } catch (error) {
    res.status(500).json({ message: "Failed to track view" });
  }
});

app.get("/api/analytics/rfp/:id", requireAuth, async (req, res) => {
  try {
    const id = validatePositiveInt(req.params.id, 'RFP ID', res);
    if (id === null) return;

    const analytics = await storage.getAnalyticsByRfpId(id);
    if (!analytics) {
      return res.status(404).json({ message: "Analytics not found" });
    }
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch RFP analytics" });
  }
});

// File upload endpoint
app.post("/api/upload", requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: "Only image files are allowed" });
    }

    // Mock successful upload
    res.json({ url: `https://example.com/mock-upload/${Date.now()}` });
  } catch (error) {    res.status(500).json({ message: "Failed to upload file" });
  }
});

// Serve static files
const staticDir = path.join(process.cwd(), 'dist/public');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// STRIPE PAYMENT PROCESSING SYSTEM
// Payment Routes - Fully rewritten implementation

/**
 * Get the price for featuring an RFP
 */
app.get('/api/payments/price', (req, res) => {
  res.json({ price: FEATURED_RFP_PRICE });
});

/**
 * Get Stripe configuration status
 * Provides information about the current Stripe setup
 */
app.get('/api/payments/config', (req, res) => {
  res.json(stripeStatus);
});

/**
 * Debug endpoint to check Stripe status and connection
 */
app.get('/api/payments/debug', (req, res) => {
  console.log('Stripe Debug Information:');
  console.log('- Stripe Status:', JSON.stringify(stripeStatus));
  console.log('- Has Stripe Key:', Boolean(stripeSecretKey));
  console.log('- Stripe Key Last Four:', stripeSecretKey ? `...${stripeSecretKey.slice(-4)}` : 'none');
  console.log('- Node Environment:', process.env.NODE_ENV || 'development');
  console.log('- Is Production:', isProduction);
  console.log('- Test Mode:', stripeStatus.keyType === 'test');

  // Return detailed information about Stripe configuration
  res.json({
    stripeStatus: stripeStatus,
    hasStripeKey: Boolean(stripeSecretKey),
    stripeKeyLastFour: stripeSecretKey ? `...${stripeSecretKey.slice(-4)}` : null,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: isProduction,
    testMode: stripeStatus.keyType === 'test'
  });
});

/**
 * Create payment intent for featuring an RFP
 * This endpoint handles the initial payment setup process
 */
app.post('/api/payments/create-payment-intent', requireAuth, async (req, res) => {
  try {
    const { rfpId } = req.body;

    if (!rfpId) {
      return res.status(400).json({ message: "RFP ID is required" });
    }

    // Verify the RFP exists and belongs to this user
    const rfp = await storage.getRfpById(Number(rfpId));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only feature your own RFPs" });
    }

    // Create payment intent
    let paymentIntent;

    if (stripe) {
      try {
        // Always create real payment intent with Stripe, even in development
        paymentIntent = await stripe.paymentIntents.create({
          amount: FEATURED_RFP_PRICE,
          currency: 'usd',
          metadata: {
            rfpId: String(rfpId),
            userId: String(req.user.id),
            rfpTitle: rfp.title
          },
          automatic_payment_methods: {
            enabled: true
          },
          description: `Featured RFP: ${rfp.title.substring(0, 50)}`
        });
        console.log(`✅ Created payment intent ${paymentIntent.id} for RFP ${rfpId}`);
      } catch (stripeError) {
        console.error('❌ Stripe error creating payment intent:', stripeError);

        // Always return the real Stripe error
        return res.status(500).json({ 
          message: "Payment service error: " + stripeError.message,
          reason: 'stripe_error'
        });
      }
    } else {
      // Always require Stripe, even in development mode
      return res.status(503).json({ 
        message: "Payment service is currently unavailable. Stripe is not initialized.",
        reason: 'stripe_not_initialized'
      });
    }

    // Send the client secret back to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create payment intent"
    });
  }
});

/**
 * Confirm payment and update RFP featured status
 * Verifies payment was successful and updates the RFP
 */
app.post('/api/payments/confirm-payment', requireAuth, async (req, res) => {
  try {
    const { paymentIntentId, rfpId } = req.body;

    if (!paymentIntentId || !rfpId) {
      return res.status(400).json({ message: "Payment intent ID and RFP ID are required" });
    }

    // Verify the RFP exists and belongs to this user
    const rfp = await storage.getRfpById(Number(rfpId));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only feature your own RFPs" });
    }

    // Always verify payment with Stripe
    let paymentVerified = false;

    // Verify payment with Stripe
    if (!stripe) {
      return res.status(503).json({ 
        message: 'Payment service unavailable. Stripe is not initialized.',
        reason: 'stripe_not_initialized'
      });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentVerified = paymentIntent.status === 'succeeded';

      if (!paymentVerified) {
        console.log(`❌ Payment ${paymentIntentId} verification failed: ${paymentIntent.status}`);
        return res.status(400).json({ 
          message: `Payment verification failed: ${paymentIntent.status}` 
        });
      }
    } catch (stripeError) {
      console.error('❌ Error retrieving payment intent:', stripeError);
      return res.status(500).json({ 
        message: "Error verifying payment: " + stripeError.message
      });
    }

    // Update the RFP to be featured
    const updatedRfp = await storage.updateRfp(Number(rfpId), {
      featured: true,
      featuredAt: new Date()
    });

    console.log(`✅ RFP ${rfpId} successfully marked as featured`);

    res.json({
      success: true,
      rfp: updatedRfp
    });
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to confirm payment"
    });
  }
});

// Get payment status
app.get('/api/payments/status/:paymentIntentId', requireAuth, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment intent ID is required" });
    }

    // We no longer support mock payments, always use Stripe

    // Verify with Stripe if available
    if (!stripe) {
      return res.status(503).json({ 
        message: 'Payment service unavailable. Stripe is not initialized.',
        reason: 'stripe_not_initialized'
      });
    }

    // Get payment intent from Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      res.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata
      });
    } catch (stripeError) {
      console.error('❌ Error retrieving payment intent:', stripeError);

      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({ message: "Payment intent not found" });
      }

      return res.status(500).json({ 
        message: "Error retrieving payment: " + stripeError.message
      });
    }
  } catch (error) {
    console.error('❌ Error fetching payment status:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch payment status"
    });
  }
});

/**
 * Cancel a payment intent
 * Allows users to cancel an in-progress payment
 */
app.post('/api/payments/cancel-payment', requireAuth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment intent ID is required" });
    }



    // Verify with Stripe if available
    if (!stripe) {
      return res.status(503).json({ 
        message: 'Payment service unavailable. Stripe is not initialized.',
        reason: 'stripe_not_initialized'
      });
    }

    // Get the payment intent from Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError) {
      console.error('❌ Error retrieving payment intent:', stripeError);

      if (stripeError.code === 'resource_missing') {
        return res.status(404).json({ message: "Payment intent not found" });
      }

      return res.status(500).json({ 
        message: "Error retrieving payment: " + stripeError.message
      });
    }

    // Verify ownership
    if (paymentIntent.metadata.userId !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only cancel your own payments" });
    }

    // Cancel the payment intent
    try {
      const cancelledPayment = await stripe.paymentIntents.cancel(paymentIntentId);

      if (cancelledPayment.status === 'canceled') {
        console.log(`✅ Payment ${paymentIntentId} successfully cancelled`);
        return res.json({
          success: true,
          message: "Payment cancelled successfully"
        });
      } else {
        return res.status(400).json({ 
          message: `Failed to cancel payment: ${cancelledPayment.status}`
        });
      }
    } catch (stripeError) {
      console.error('❌ Error cancelling payment intent:', stripeError);
      return res.status(500).json({ 
        message: "Error cancelling payment: " + stripeError.message
      });
    }
  } catch (error) {
    console.error('❌ Error cancelling payment:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to cancel payment"
    });
  }
});

// User routes
app.get("/api/user", requireAuth, (req, res) => {
    res.json(req.user);
});

// Auth routes
app.post("/api/register", registerLimiter, async (req, res, next) => {
  try {
    safeLog(`[Auth] Registration attempt for email: ${maskEmail(req.body.email)}`);
    
    // Validate request body against schema
    const validationResult = insertUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      safeLog(`[Auth] Registration validation failed:`, validationResult.error.issues);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    
    const existingUser = await storage.getUserByUsername(req.body.email);
    if (existingUser) {
      safeLog(`[Auth] Registration failed - email already exists: ${maskEmail(req.body.email)}`);
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await hashPassword(req.body.password);
    safeLog(`[Auth] Password hashed for new registration`);

    const user = await storage.createUser({
      ...req.body,
      password: hashedPassword,
      emailVerified: false,
    });
    
    safeLog(`[Auth] User created successfully, id: ${user.id}`);
    
    // Generate and send verification email
    try {
      const token = await createVerificationToken(user.id);
      const emailSent = await sendVerificationEmail(user.email, token, user.companyName);
      
      if (emailSent) {
        safeLog(`[Auth] Verification email sent to: ${maskEmail(user.email)}`);
      } else {
        safeError(`[Auth] Failed to send verification email to: ${maskEmail(user.email)}`);
      }
    } catch (emailError) {
      safeError(`[Auth] Error sending verification email:`, emailError);
    }
    
    req.login(user, (err) => {
      if (err) {
        safeError(`[Auth] Error during login after registration:`, err);
        return next(err);
      }
      res.status(201).json(user);
    });
  } catch (error) {
    safeError(`[Auth] Error during registration:`, error);
    next(error);
  }
});

app.get("/api/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: "Invalid verification token" });
    }
    
    safeLog(`[Auth] Email verification attempt with token: ${token.slice(0, 8)}...`);
    const userId = await verifyEmailToken(token);
    
    if (!userId) {
      safeLog(`[Auth] Email verification failed - invalid or expired token`);
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }
    
    safeLog(`[Auth] Email verified successfully for user: ${userId}`);
    
    // If user is already logged in, update the session
    if (req.isAuthenticated() && req.user.id === userId) {
      const updatedUser = await storage.getUser(userId);
      if (updatedUser) {
        req.login(updatedUser, (err) => {
          if (err) {
            safeError(`[Auth] Error updating user session after verification:`, err);
          }
        });
      }
    }
    
    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    safeError(`[Auth] Error during email verification:`, error);
    return res.status(500).json({ message: "An error occurred during email verification" });
  }
});

app.post("/api/resend-verification", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Please log in to resend verification email" });
    }
    
    const user = req.user;
    
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    
    safeLog(`[Auth] Resending verification email to user: ${user.id}`);
    const token = await createVerificationToken(user.id);
    const emailSent = await sendVerificationEmail(user.email, token, user.companyName);
    
    if (emailSent) {
      safeLog(`[Auth] Verification email resent to: ${maskEmail(user.email)}`);
      return res.status(200).json({ message: "Verification email sent successfully" });
    } else {
      safeError(`[Auth] Failed to resend verification email to: ${maskEmail(user.email)}`);
      return res.status(500).json({ message: "Failed to send verification email" });
    }
  } catch (error) {
    safeError(`[Auth] Error resending verification email:`, error);
    return res.status(500).json({ message: "An error occurred while resending the verification email" });
  }
});

app.post("/api/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    safeLog(`[Auth] Password reset requested for email: ${maskEmail(email)}`);
    const user = await storage.getUserByUsername(email);
    
    if (!user) {
      safeLog(`[Auth] Password reset requested for non-existent email: ${maskEmail(email)}`);
      return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
    }
    
    const token = await createPasswordResetToken(user.id);
    const emailSent = await sendPasswordResetEmail(user.email, token, user.companyName);
    
    if (emailSent) {
      safeLog(`[Auth] Password reset email sent to: ${maskEmail(user.email)}`);
      return res.status(200).json({ message: "Password reset email sent successfully" });
    } else {
      safeError(`[Auth] Failed to send password reset email to: ${maskEmail(user.email)}`);
      return res.status(500).json({ message: "Failed to send password reset email" });
    }
  } catch (error) {
    safeError(`[Auth] Error during password reset request:`, error);
    return res.status(500).json({ message: "An error occurred while processing your request" });
  }
});

app.get("/api/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: "Invalid reset token" });
    }
    
    safeLog(`[Auth] Verifying password reset token: ${token.slice(0, 8)}...`);
    const userId = await verifyPasswordResetToken(token);
    
    if (!userId) {
      safeLog(`[Auth] Invalid or expired password reset token`);
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    
    safeLog(`[Auth] Valid password reset token for user: ${userId}`);
    return res.status(200).json({ message: "Valid reset token", token });
  } catch (error) {
    safeError(`[Auth] Error verifying reset token:`, error);
    return res.status(500).json({ message: "An error occurred while verifying the reset token" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "Token, password, and confirmPassword are required" });
    }
    
    // Validate password
    const passwordValidation = passwordResetSchema.safeParse({ password, confirmPassword });
    if (!passwordValidation.success) {
      return res.status(400).json({ 
        message: "Password validation failed", 
        errors: passwordValidation.error.errors 
      });
    }
    
    safeLog(`[Auth] Resetting password with token: ${token.slice(0, 8)}...`);
    const userId = await verifyPasswordResetToken(token);
    
    if (!userId) {
      safeLog(`[Auth] Password reset failed - invalid or expired token`);
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    
    // Update password
    const hashedPassword = await hashPassword(password);
    await storage.updateUser(userId, { password: hashedPassword });
    
    // Consume the token
    await consumePasswordResetToken(userId);
    
    safeLog(`[Auth] Password reset successful for user: ${userId}`);
    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    safeError(`[Auth] Error during password reset:`, error);
    return res.status(500).json({ message: "An error occurred during password reset" });
  }
});

app.post("/api/login", loginLimiter, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: info.message });
        }
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.json(user);
        });
    })(req, res, next);
});

app.post("/api/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ message: "Logged out successfully" });
    });
});

// User settings routes
app.post("/api/user/settings", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const updatedUser = await storage.updateUser(req.user.id, {
      ...req.body,
      companyName: req.body.companyName,
      contact: req.body.contact,
      telephone: req.body.telephone,
      cell: req.body.cell,
      businessEmail: req.body.businessEmail,
      trade: req.body.trade,
      isMinorityOwned: req.body.isMinorityOwned,
      minorityGroup: req.body.minorityGroup,
      certificationName: req.body.certificationName,
      logo: req.body.logo,
      language: req.body.language
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(400).json({ message: "Failed to update settings" });
  }
});

app.post("/api/user/deactivate", requireAuth, async (req, res) => {
    try {
        // Add updateUser to storage implementation if missing
        if (!storage.updateUser) {
            return res.status(501).json({ message: "User management not implemented" });
        }

        const updatedUser = await storage.updateUser(req.user.id, {
            status: "deactivated",
        });

        req.logout((err) => {
            if (err) {
                return res.status(500).json({ message: "Error logging out" });
            }
            res.json(updatedUser);
        });
    } catch (error) {
        sendErrorResponse(res, error, 400, ErrorMessages.UPDATE_FAILED, 'AccountDeactivation');
    }
});

app.delete("/api/user", requireAuth, async (req, res) => {
    try {
        // Add deleteUser to storage implementation if missing
        if (!storage.deleteUser) {
            return res.status(501).json({ message: "User deletion not implemented" });
        }

        await storage.deleteUser(req.user.id);

        req.logout((err) => {
            if (err) {
                return sendErrorResponse(res, err, 500, ErrorMessages.INTERNAL_ERROR, 'LogoutOnDelete');
            }
            res.json({ message: "Account deleted successfully" });
        });
    } catch (error) {
        sendErrorResponse(res, error, 400, ErrorMessages.DELETE_FAILED, 'AccountDeletion');
    }
});

// User onboarding endpoint
app.post("/api/user/onboarding", requireAuth, async (req, res) => {
    try {

        // Add updateUser to storage implementation if missing
        if (!storage.updateUser) {
            return res.status(501).json({ message: "User profile updates not implemented" });
        }

        // In a full implementation, we would validate with a schema
        // For simplicity in entrypoint.js, we'll just proceed with the data

        const updatedUser = await storage.updateUser(req.user.id, {
            ...req.body,
            onboardingComplete: true
        });

        res.json(updatedUser);
    } catch (error) {
        const safeMessage = getSafeValidationMessage(error);
        sendErrorResponse(res, error, 400, safeMessage || ErrorMessages.UPDATE_FAILED, 'Onboarding');
    }
});

// Employee routes - Mock implementation (removed as per routes.ts)

// Get RFIs received by the user's organization
app.get("/api/rfis/received", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    safeLog(`Fetching received RFIs for user: ${user.id}`);

    // Get all RFPs owned by this user
    const allRfps = await storage.getRfps();
    const userRfps = allRfps.filter(rfp => rfp.organizationId === user.id);
    safeLog(`Found user RFPs: ${userRfps.length}`);

    // Get all RFIs for these RFPs
    const allReceivedRfis = [];
    for (const rfp of userRfps) {
      const rfpRfis = await storage.getRfisByRfp(rfp.id);
      // Add RFP data to each RFI
      const rfisWithRfp = rfpRfis.map(rfi => ({
        ...rfi,
        rfp
      }));
      allReceivedRfis.push(...rfisWithRfp);
    }

    safeLog(`Sending response with ${allReceivedRfis.length} received RFIs`);
    res.json(allReceivedRfis);
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'ReceivedRFIs');
  }
});

// Get conversation messages for an RFI
app.get("/api/rfis/:id/messages", requireAuth, async (req, res) => {
  try {
    const rfiId = validatePositiveInt(req.params.id, 'RFI ID', res);
    if (rfiId === null) return;

    // Get the RFI details to check permissions
    const rfis = await storage.getRfisByEmail(req.user.email);
    const contractorRfi = rfis.find(r => r.id === rfiId);
    
    // Check if user is the contractor who submitted the RFI
    let hasPermission = !!contractorRfi;
    
    // If not the contractor, check if they're the RFP owner
    if (!hasPermission) {
      // Find all RFPs by this user and their RFIs
      const allRfps = await storage.getRfps();
      const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user.id);
      
      for (const rfp of userRfps) {
        const rfpRfis = await storage.getRfisByRfp(rfp.id);
        if (rfpRfis.some(r => r.id === rfiId)) {
          hasPermission = true;
          break;
        }
      }
    }

    if (!hasPermission) {
      safeLog(`Authorization failed: User ${req.user?.id} attempted to view RFI ${rfiId} conversation`);
      return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFIConversation');
    }

    const messages = await storage.getRfiMessages(rfiId);
    res.json(messages);
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'RFIMessages');
  }
});

// Send a message in RFI conversation
app.post("/api/rfis/:id/messages", requireAuth, upload.array('attachment', 5), async (req, res) => {
  try {
    const rfiId = validatePositiveInt(req.params.id, 'RFI ID', res);
    if (rfiId === null) return;
    
    const { message } = req.body;
    const files = req.files || [];

    if ((!message || message.trim() === "") && files.length === 0) {
      return sendErrorResponse(res, new Error('Message content or file attachment is required'), 400, ErrorMessages.BAD_REQUEST, 'RFIMessageValidation');
    }

    // Get the RFI details to check permissions
    const rfis = await storage.getRfisByEmail(req.user.email);
    const contractorRfi = rfis.find(r => r.id === rfiId);
    
    // Check if user is the contractor who submitted the RFI
    let hasPermission = !!contractorRfi;
    let targetUserId = null; // Who to notify
    
    // If not the contractor, check if they're the RFP owner
    if (!hasPermission) {
      const allRfps = await storage.getRfps();
      const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user.id);
      
      for (const rfp of userRfps) {
        const rfpRfis = await storage.getRfisByRfp(rfp.id);
        const foundRfi = rfpRfis.find(r => r.id === rfiId);
        if (foundRfi) {
          hasPermission = true;
          // Find the contractor user to notify
          const contractorUser = await storage.getUserByUsername(foundRfi.email);
          if (contractorUser) {
            targetUserId = contractorUser.id;
          }
          break;
        }
      }
    } else {
      // User is contractor, find RFP owner to notify
      if (contractorRfi && contractorRfi.rfpId) {
        const rfp = await storage.getRfpById(contractorRfi.rfpId);
        if (rfp) {
          targetUserId = rfp.organizationId;
        }
      }
    }

    if (!hasPermission) {
      safeLog(`Authorization failed: User ${req.user?.id} attempted to send message in RFI ${rfiId}`);
      return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFIMessage');
    }

    // Create the message
    const newMessage = await storage.createRfiMessage({
      rfiId,
      senderId: req.user.id,
      message: message ? message.trim() : ""
    });

    // Handle file attachments if present
    if (files.length > 0) {
      const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
      
      for (const file of files) {
        try {
          // SECURITY: Validate file type and size
          if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            console.warn(`Rejected file ${file.originalname}: invalid mime type ${file.mimetype}`);
            continue;
          }
          
          if (file.size > MAX_FILE_SIZE) {
            console.warn(`Rejected file ${file.originalname}: size ${file.size} exceeds limit ${MAX_FILE_SIZE}`);
            continue;
          }
          
          // SECURITY: Sanitize filename - remove dangerous characters
          const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          
          // For entrypoint.js, we'll store files locally or use a simple upload
          // In production, this would use Cloudinary like in server/routes.ts
          await storage.createRfiAttachment({
            messageId: newMessage.id,
            filename: sanitizedFilename,
            fileUrl: `/uploads/rfi-attachments/${Date.now()}_${sanitizedFilename}`,
            fileSize: file.size,
            mimeType: file.mimetype
          });
          
          safeLog(`Successfully uploaded file: ${sanitizedFilename} (${file.size} bytes)`);
        } catch (uploadError) {
          console.error(`File upload error for ${file.originalname}:`, uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    // Auto-mark RFI as "responded" if the sender is not the contractor
    if (hasPermission && !contractorRfi) {
      // This is the RFP owner responding, mark as responded
      await storage.updateRfiStatus(rfiId, "responded");
    }

    // Create notification for the other party
    if (targetUserId) {
      const notification = await storage.createNotification({
        userId: targetUserId,
        type: "rfi_response",
        title: "New RFI Message",
        message: `New message in RFI conversation`,
        relatedId: rfiId,
        relatedType: "rfi"
      });
      
      // Send real-time notification
      if (global.sendNotificationToUser) {
        global.sendNotificationToUser(targetUserId, notification);
      }
    }

    // Return the message with sender information and attachments
    const messageWithSender = await storage.getRfiMessages(rfiId);
    const createdMessage = messageWithSender.find(m => m.id === newMessage.id);
    
    res.status(201).json(createdMessage);
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.CREATE_FAILED, 'RFIMessage');
  }
});

// Download attachment endpoint with authentication
app.get("/api/attachments/:attachmentId/download", requireAuth, async (req, res) => {
  try {
    const attachmentId = validatePositiveInt(req.params.attachmentId, 'Attachment ID', res);
    if (attachmentId === null) return;
    
    // Get attachment details
    const attachment = await storage.getRfiAttachmentById(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }
    
    // Get the RFI message this attachment belongs to
    const message = await storage.getRfiMessageById(attachment.messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Check if user has permission to access this attachment
    const rfis = await storage.getRfisByEmail(req.user.email);
    const userRfi = rfis.find(r => r.id === message.rfiId);
    
    let hasPermission = !!userRfi;
    
    // If not the submitter, check if they're the RFP owner
    if (!hasPermission) {
      const allRfps = await storage.getRfps();
      const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user.id);
      
      for (const rfp of userRfps) {
        const rfpRfis = await storage.getRfisByRfp(rfp.id);
        if (rfpRfis.some(r => r.id === message.rfiId)) {
          hasPermission = true;
          break;
        }
      }
    }
    
    if (!hasPermission) {
      safeLog(`Authorization failed: User ${req.user?.id} attempted to access attachment ${req.params.attachmentId}`);
      return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'AttachmentAccess');
    }
    
    // Redirect to the file URL
    res.redirect(attachment.fileUrl);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'AttachmentDownload');
  }
});

// Delete RFI endpoint
app.delete("/api/rfis/:id", requireAuth, async (req, res) => {
  try {
    const rfiId = validatePositiveInt(req.params.id, 'RFI ID', res);
    if (rfiId === null) return;
    
    // Get RFI details to check permissions
    const rfis = await storage.getRfisByEmail(req.user.email);
    const userRfi = rfis.find(r => r.id === rfiId);
    
    // Check if user is the one who submitted the RFI
    let hasPermission = !!userRfi;
    
    // If not the submitter, check if they're the RFP owner
    if (!hasPermission) {
      const allRfps = await storage.getRfps();
      const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user.id);
      
      for (const rfp of userRfps) {
        const rfpRfis = await storage.getRfisByRfp(rfp.id);
        if (rfpRfis.some(r => r.id === rfiId)) {
          hasPermission = true;
          break;
        }
      }
    }

    if (!hasPermission) {
      safeLog(`Authorization failed: User ${req.user?.id} attempted to delete RFI ${rfiId}`);
      return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFIDeletion');
    }

    await storage.deleteRfi(rfiId);
    res.json({ message: "RFI deleted successfully" });
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.DELETE_FAILED, 'RFIDeletion');
  }
});

// Notification routes
app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    const notifications = await storage.getNotificationsByUser(req.user.id);
    res.json(notifications);
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'Notifications');
  }
});

app.post("/api/notifications", requireAuth, async (req, res) => {
  try {
    // In entrypoint.js, we skip Zod validation for simplicity
    const notification = await storage.createNotification(req.body);
    
    // Send real-time notification if user is connected
    if (global.sendNotificationToUser) {
      global.sendNotificationToUser(req.body.userId, notification);
    }
    
    res.status(201).json(notification);
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.CREATE_FAILED, 'NotificationCreation');
  }
});

app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const id = validatePositiveInt(req.params.id, 'Notification ID', res);
    if (id === null) return;
    
    const notification = await storage.markNotificationAsRead(id);
    res.json(notification);
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.UPDATE_FAILED, 'NotificationMarkRead');
  }
});

app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await storage.markAllNotificationsAsRead(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.UPDATE_FAILED, 'NotificationMarkAllRead');
  }
});

app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
  try {
    const id = validatePositiveInt(req.params.id, 'Notification ID', res);
    if (id === null) return;
    
    await storage.deleteNotification(id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    sendErrorResponse(res, error, 500, ErrorMessages.DELETE_FAILED, 'NotificationDeletion');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
    sendErrorResponse(res, err, 500, ErrorMessages.INTERNAL_ERROR, 'GlobalErrorHandler');
});

export default app;