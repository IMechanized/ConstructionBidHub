import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and } from 'drizzle-orm';
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

// Define schema
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password"),
  companyName: text("company_name").notNull(),
  contact: text("contact"),
  telephone: text("telephone"),
  cell: text("cell"),
  businessEmail: text("business_email"),
  isMinorityOwned: boolean("is_minority_owned"),
  minorityGroup: text("minority_group"),
  trade: text("trade"),
  certificationName: text("certification_name").array(),
  logo: text("logo"),
  onboardingComplete: boolean("onboarding_complete"),
  status: text("status"),
  language: text("language"),
  emailVerified: boolean("email_verified"),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

const rfps = pgTable("rfps", {
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
  status: text("status"),
  organizationId: integer("organization_id").references(() => users.id),
  featured: boolean("featured"),
  featuredAt: timestamp("featured_at"),
  createdAt: timestamp("created_at"),
});

const rfis = pgTable("rfis", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at")
});

const rfpAnalytics = pgTable("rfp_analytics", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id).notNull(),
  date: date("date").notNull(),
  totalViews: integer("total_views").default(0),
  uniqueViews: integer("unique_views").default(0),
  averageViewTime: integer("average_view_time").default(0),
  totalBids: integer("total_bids").default(0),
  clickThroughRate: integer("click_through_rate").default(0),
});

const rfpViewSessions = pgTable("rfp_view_sessions", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  viewDate: timestamp("view_date").notNull(),
  duration: integer("duration").default(0),
});

// Initialize Drizzle ORM
const db = drizzle(pool);

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
          contact: updates.contact,
          telephone: updates.telephone,
          cell: updates.cell,
          businessEmail: updates.businessEmail,
          trade: updates.trade,
          isMinorityOwned: updates.isMinorityOwned,
          minorityGroup: updates.minorityGroup,
          certificationName: updates.certificationName,
          logo: updates.logo,
          language: updates.language
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

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
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
        const user = await storage.getUserByUsername(email);
        
        if (!user) {
          safeLog(`[Auth] No user found for email: ${maskEmail(email)}`);
          return done(null, false, { message: "Invalid email or password" });
        }
        
        if (user.status === 'deactivated') {
          safeLog(`[Auth] Account deactivated for email: ${maskEmail(email)}`);
          return done(null, false, { message: "Account is deactivated" });
        }
        
        safeLog('[Auth] User found, verifying password');
        const isValidPassword = await comparePasswords(password, user.password);
        
        if (!isValidPassword) {
          safeLog(`[Auth] Invalid password for email: ${maskEmail(email)}`);
          return done(null, false, { message: "Invalid email or password" });
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
    const rfp = await storage.getRfpById(Number(req.params.id));
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
    const rfp = await storage.getRfpById(Number(req.params.id));
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

    const updated = await storage.updateRfp(Number(req.params.id), processedData);
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

    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own RFPs" });
    }

    await storage.deleteRfp(Number(req.params.id));
    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting RFP:', error);
    res.status(500).json({ message: error.message || "Failed to delete RFP" });
  }
});

// RFI routes
app.post("/api/rfps/:id/rfi", requireAuth, async (req, res) => {
  try {
    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }

    const rfi = await storage.createRfi({
      ...req.body,
      email: req.user.email,
      rfpId: Number(req.params.id),
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
    // First get all RFIs for this RFP
    const rfis = await storage.getRfisByRfp(Number(req.params.id));

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
    const rfpId = Number(req.params.rfpId);
    const rfiId = Number(req.params.rfiId);
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
    const analytics = await storage.getAnalyticsByRfpId(Number(req.params.id));
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
        console.error("Error deactivating account:", error);
        res.status(400).json({ message: "Failed to deactivate account" });
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
                return res.status(500).json({ message: "Error logging out" });
            }
            res.json({ message: "Account deleted successfully" });
        });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(400).json({ message: "Failed to delete account" });
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
        console.error("Error completing onboarding:", error);
        res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to complete onboarding"
        });
    }
});

// Employee routes - Mock implementation (removed as per routes.ts)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
res.status(500).json({ message: "Internal server error" });
});

export default app;