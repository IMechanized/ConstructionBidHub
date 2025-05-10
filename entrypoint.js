// This file serves as a direct entrypoint for Vercel
// Standalone implementation specifically for serverless deployment
// All necessary code is included directly to avoid import issues

import express from 'express';
import { createServer } from 'http';
import session from 'express-session';
import crypto from 'crypto';
import { promisify } from "util";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and } from 'drizzle-orm';
import { pgTable, text, integer, boolean, timestamp, serial, doublePrecision, date } from 'drizzle-orm/pg-core';
import createMemoryStore from 'memorystore';
import ws from 'ws';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Configure WebSocket for Neon serverless driver if available
if (ws) {
  neonConfig.webSocketConstructor = ws;
}

// Initialize memory store for session - will be configured in the storage object
// to ensure consistent usage throughout the application

// Initialize database connection
const getDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return process.env.DATABASE_URL;
};

// Create connection pool optimized for serverless
const pool = new Pool({ 
  connectionString: getDatabaseUrl(),
  max: 1, // Serverless environments need fewer connections
  idleTimeoutMillis: 10000, // shorter idle timeout in serverless
  connectionTimeoutMillis: 5000, // 5 seconds connection timeout
});

// Define simplified schema for critical tables
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

// RFIs (Request for Information) table
const rfis = pgTable("rfis", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id),
  // Note: organizationId does not exist in the actual database schema
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at")
});

// RFP Analytics table
const rfpAnalytics = pgTable("rfp_analytics", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id).notNull(),
  views: integer("views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  averageViewTime: integer("average_view_time").default(0),
  createdAt: timestamp("created_at"),
});

// RFP View Sessions table
const rfpViewSessions = pgTable("rfp_view_sessions", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").references(() => rfps.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  duration: integer("duration").default(0),
  createdAt: timestamp("created_at"),
});

// Initialize Drizzle ORM
const db = drizzle(pool);

// Password utilities
const scryptAsync = crypto.scrypt ? promisify(crypto.scrypt) : null;

async function comparePasswords(supplied, stored) {
  if (!stored || !supplied) return false;
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

// Create a simplified storage implementation
const storage = {
  async getUser(id) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  },
  
  async getUserByUsername(email) {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
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
      return rfp || null;
    } catch (error) {
      console.error("Error getting RFP by ID:", error);
      return null;
    }
  },
  
  async getRfisByRfp(rfpId) {
    try {
      // Simply return the RFIs associated with this RFP
      return await db.select().from(rfis).where(eq(rfis.rfpId, rfpId));
    } catch (error) {
      console.error("Error getting RFIs by RFP:", error);
      return [];
    }
  },
  
  async createRfi(rfiData) {
    try {
      const [newRfi] = await db.insert(rfis).values({
        rfpId: rfiData.rfpId,
        email: rfiData.email,
        message: rfiData.message || rfiData.question,
        status: "pending"
      }).returning();
      
      return newRfi;
    } catch (error) {
      console.error("Error creating RFI:", error);
      throw error;
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
  
  async getAnalyticsByRfpId(rfpId) {
    try {
      const [analytics] = await db.select().from(rfpAnalytics).where(eq(rfpAnalytics.rfpId, rfpId));
      
      if (analytics) {
        return analytics;
      }
      
      // If no analytics found, create a new entry
      const [newAnalytics] = await db.insert(rfpAnalytics).values({
        rfpId,
        views: 0,
        uniqueVisitors: 0,
        averageViewTime: 0
      }).returning();
      
      return newAnalytics;
    } catch (error) {
      console.error("Error getting analytics by RFP ID:", error);
      return null;
    }
  },
  
  async getBoostedAnalytics(userId) {
    try {
      // Get all featured RFPs from this user
      const featuredRfps = await db.select().from(rfps)
        .where(and(
          eq(rfps.organizationId, userId),
          eq(rfps.featured, true)
        ));
      
      // Get analytics for each featured RFP
      const analyticsWithRfps = await Promise.all(
        featuredRfps.map(async (rfp) => {
          const analytics = await this.getAnalyticsByRfpId(rfp.id);
          return {
            ...analytics,
            rfp
          };
        })
      );
      
      return analyticsWithRfps;
    } catch (error) {
      console.error("Error getting boosted analytics:", error);
      return [];
    }
  },
  
  // Add a session store property to avoid errors
  get sessionStore() {
    // Create a memory store instead of PostgreSQL session store for simplicity
    // This prevents errors when the session tries to access the database
    const MemoryStore = createMemoryStore(session);
    return new MemoryStore({
      checkPeriod: 86400000 // 24 hours (in milliseconds)
    });
  }
};

// Create Express app instance
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session middleware
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    }
  })
);

// Set up authentication
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByUsername(email);
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        if (user.status === 'unverified') {
          return done(null, false, { message: 'Please verify your email address' });
        }
        
        if (user.status === 'deactivated') {
          return done(null, false, { message: 'This account has been deactivated' });
        }
        
        const isMatch = await comparePasswords(password, user.password || '');
        
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Logger middleware for API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// We're implementing routes directly in this file
// No need to register external routes

// Authentication helper function (middleware) 
function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    console.log("[Auth] Unauthorized access attempt to " + req.originalUrl);
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Simple function to handle errors
function handleError(res, error, message = "An error occurred") {
  console.error(message + ":", error);
  res.status(500).json({ error: message });
}

// Configure multer for handling file uploads (simplified)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Health check endpoints - direct implementations
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Primary health endpoint used by client
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'healthy', 
      serverStartTime: Date.now()
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ 
      status: 'unhealthy', 
      error: errorMessage,
      serverStartTime: Date.now()
    });
  }
});

// File upload endpoint
app.post("/api/upload", upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');

    // Check authentication first
    try {
      if (!req.isAuthenticated()) {
        console.log('Authentication failed');
        return res.status(401).json({ message: "Authentication required" });
      }
    } catch (error) {
      console.log('Authentication failed:', error);
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      console.log('Invalid file type:', req.file.mimetype);
      return res.status(400).json({ message: "Only image files are allowed" });
    }

    console.log('File received:', req.file.originalname, req.file.mimetype);

    // In a real implementation we would upload to Cloudinary here
    // For the entrypoint.js version we'll just return a mock success
    res.json({ url: `https://example.com/mock-upload/${Date.now()}` });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to upload file",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// API routes for RFPs - direct implementation as backup
app.get("/api/rfps", async (req, res) => {
  try {
    const rfps = await storage.getRfps();
    const rfpsWithOrgs = await Promise.all(
      rfps.map(async (rfp) => {
        if (rfp.organizationId === null) {
          return {
            ...rfp,
            organization: null
          };
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
    console.error('Error fetching RFPs:', error);
    res.status(500).json({ message: "Error fetching RFPs" });
  }
});

// Get featured RFPs
app.get("/api/rfps/featured", async (req, res) => {
  try {
    // We need to add getFeaturedRfps to the storage interface
    const featuredRfps = await Promise.all(
      (await storage.getRfps())
        .filter(rfp => rfp.featured === true)
        .map(async (rfp) => {
          if (rfp.organizationId === null) {
            return {
              ...rfp,
              organization: null
            };
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
    
    res.json(featuredRfps);
  } catch (error) {
    console.error('Error fetching featured RFPs:', error);
    res.status(500).json({ message: "Failed to fetch featured RFPs" });
  }
});

// User routes
app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) {
    console.log('[Auth] Unauthorized access attempt to /api/user');
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json(req.user);
});

// Auth routes
app.post("/api/login", (req, res, next) => {
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

// RFP Detail route
app.get("/api/rfps/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rfp = await storage.getRfpById(id);
    
    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }
    
    // Get the organization details
    let organization = null;
    if (rfp.organizationId) {
      const org = await storage.getUser(rfp.organizationId);
      if (org) {
        organization = {
          id: org.id,
          companyName: org.companyName,
          logo: org.logo
        };
      }
    }
    
    res.json({
      ...rfp,
      organization
    });
  } catch (error) {
    console.error("Error getting RFP details:", error);
    res.status(500).json({ error: "Failed to fetch RFP details" });
  }
});

// Create new RFP
app.post("/api/rfps", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    console.log('RFP creation request received:', req.body);

    // Note: In a full implementation we would validate with a schema
    // For simplicity in entrypoint.js we'll just proceed with the data
    
    // Add createRfp to storage implementation if missing
    if (!storage.createRfp) {
      return res.status(501).json({ message: "RFP creation not implemented" });
    }

    const rfp = await storage.createRfp({
      ...req.body,
      organizationId: req.user.id,
    });
    console.log('RFP created successfully:', rfp);
    res.status(201).json(rfp);
  } catch (error) {
    console.error('RFP creation error:', error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Failed to create RFP" });
    }
  }
});

// Update existing RFP
app.put("/api/rfps/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfpId = parseInt(req.params.id);
    const rfp = await storage.getRfpById(rfpId);
    
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    
    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own RFPs" });
    }
    
    // Add updateRfp to storage implementation if missing
    if (!storage.updateRfp) {
      return res.status(501).json({ message: "RFP update not implemented" });
    }
    
    const updated = await storage.updateRfp(rfpId, req.body);
    res.json(updated);
  } catch (error) {
    console.error('Error updating RFP:', error);
    res.status(500).json({ message: "Failed to update RFP" });
  }
});

// Delete RFP
app.delete("/api/rfps/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfpId = parseInt(req.params.id);
    const rfp = await storage.getRfpById(rfpId);
    
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    
    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own RFPs" });
    }
    
    // Add deleteRfp to storage implementation if missing
    if (!storage.deleteRfp) {
      return res.status(501).json({ message: "RFP deletion not implemented" });
    }
    
    await storage.deleteRfp(rfpId);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting RFP:', error);
    res.status(500).json({ message: "Failed to delete RFP" });
  }
});

// Employee routes
app.get("/api/employees", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Add getEmployees to storage implementation if missing
    if (!storage.getEmployees) {
      return res.status(501).json({ message: "Employee management not implemented" });
    }
    
    const employees = await storage.getEmployees(req.user.id);
    res.json(employees);
  } catch (error) {
    console.error("Error getting employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Add createEmployee to storage implementation if missing
    if (!storage.createEmployee) {
      return res.status(501).json({ message: "Employee creation not implemented" });
    }
    
    const employee = await storage.createEmployee({
      ...req.body,
      organizationId: req.user.id,
    });
    res.status(201).json(employee);
  } catch (error) {
    console.error("Error creating employee:", error);
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Failed to create employee" });
    }
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const employeeId = parseInt(req.params.id);
    
    // Add getEmployee to storage implementation if missing
    if (!storage.getEmployee) {
      return res.status(501).json({ message: "Employee management not implemented" });
    }
    
    const employee = await storage.getEmployee(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    if (employee.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only manage your own employees" });
    }
    
    // Add deleteEmployee to storage implementation if missing
    if (!storage.deleteEmployee) {
      return res.status(501).json({ message: "Employee deletion not implemented" });
    }
    
    await storage.deleteEmployee(employeeId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// User settings routes
app.post("/api/user/settings", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Add updateUser to storage implementation if missing
    if (!storage.updateUser) {
      return res.status(501).json({ message: "User profile updates not implemented" });
    }
    
    const updatedUser = await storage.updateUser(req.user.id, {
      ...req.body,
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(400).json({ message: "Failed to update settings" });
  }
});

app.post("/api/user/deactivate", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
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

app.delete("/api/user", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
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
app.post("/api/user/onboarding", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

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

// RFI routes
app.get("/api/rfps/:id/rfi", async (req, res) => {
  try {
    const rfpId = parseInt(req.params.id);
    const rfis = await storage.getRfisByRfp(rfpId);
    res.json(rfis);
  } catch (error) {
    console.error("Error getting RFIs:", error);
    res.status(500).json({ error: "Failed to fetch RFIs" });
  }
});

app.post("/api/rfps/:id/rfi", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfpId = parseInt(req.params.id);
    
    // Check if the RFP exists
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    
    // Add createRfi to storage implementation if missing
    if (!storage.createRfi) {
      return res.status(501).json({ message: "RFI creation not implemented" });
    }
    
    const rfiData = {
      ...req.body,
      email: req.user.email,  // Use authenticated user's email
      rfpId
    };
    
    const newRfi = await storage.createRfi(rfiData);
    res.status(201).json({ 
      message: "Request for information submitted successfully",
      rfi: newRfi
    });
  } catch (error) {
    console.error("Error creating RFI:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create RFI" 
    });
  }
});

// RFI status update endpoint
app.put("/api/rfps/:rfpId/rfi/:rfiId/status", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfpId = parseInt(req.params.rfpId);
    const rfiId = parseInt(req.params.rfiId);
    const { status } = req.body;
    
    if (!status || !['pending', 'responded'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    // Check if the RFP exists and belongs to the user
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    
    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only update RFIs for your own RFPs" });
    }
    
    // Add updateRfiStatus to storage implementation if missing
    if (!storage.updateRfiStatus) {
      return res.status(501).json({ message: "RFI status updates not implemented" });
    }
    
    const updatedRfi = await storage.updateRfiStatus(rfiId, status);
    res.json(updatedRfi);
  } catch (error) {
    console.error("Error updating RFI status:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to update RFI status" 
    });
  }
});

app.get("/api/rfis", async (req, res) => {
  try {
    const { email } = req.query;
    
    // Add debug logging
    console.log('GET /api/rfis - Auth status:', req.isAuthenticated());
    console.log('GET /api/rfis - User:', req.user);
    
    if (email) {
      const rfis = await storage.getRfisByEmail(email);
      return res.json(rfis);
    }
    
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('User not authenticated, returning 401');
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.user;
    console.log('Fetching RFIs for email:', user.email);
    
    const userRfis = await storage.getRfisByEmail(user.email);
    console.log('Found RFIs:', userRfis.length);
    
    // Fetch RFP details for each RFI
    const rfisWithRfp = await Promise.all(
      userRfis.map(async (rfi) => {
        if (rfi.rfpId === null) {
          return {
            ...rfi,
            rfp: null
          };
        }
        const rfp = await storage.getRfpById(rfi.rfpId);
        return {
          ...rfi,
          rfp
        };
      })
    );
    
    console.log('Sending response with', rfisWithRfp.length, 'RFIs');
    res.json(rfisWithRfp);
  } catch (error) {
    console.error("Error getting RFIs:", error);
    res.status(500).json({ error: "Failed to fetch RFIs" });
  }
});

// Analytics routes
app.get("/api/analytics/rfp/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfpId = parseInt(req.params.id);
    const analytics = await storage.getAnalyticsByRfpId(rfpId);
    
    if (!analytics) {
      return res.status(404).json({ error: "Analytics not found" });
    }
    
    res.json(analytics);
  } catch (error) {
    console.error("Error getting analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/analytics/boosted", async (req, res) => {
  try {
    // Add debug logging
    console.log(`GET /api/analytics/boosted - Auth status:`, req.isAuthenticated());
    console.log(`GET /api/analytics/boosted - User:`, req.user);
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.user;
    const userId = user.id;
    console.log(`Fetching analytics for user ID: ${userId}, Email: ${user.email}`);
    
    // Use the storage interface - it has proper security checks built-in
    // This will only return RFPs that the current user owns
    const analytics = await storage.getBoostedAnalytics(userId);
    
    console.log(`Successfully retrieved ${analytics.length} analytics records for user ${userId}`);
    
    // Return the filtered analytics
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching boosted analytics:', error);
    res.status(500).json({ 
      message: "Failed to fetch analytics"
    });
  }
});

// Track RFP view duration
app.post("/api/analytics/track-view", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const { rfpId, duration } = req.body;
    
    if (!rfpId || typeof duration !== 'number') {
      return res.status(400).json({ message: "Invalid request body" });
    }
    
    console.log(`Tracking view for RFP ${rfpId} with duration ${duration}s by user ${req.user.id}`);
    
    // Check if the RFP exists
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      console.error(`RFP ${rfpId} not found`);
      return res.status(404).json({ message: "RFP not found" });
    }
    
    // Skip tracking if the viewer is the RFP owner (don't count self-views)
    if (rfp.organizationId === req.user.id) {
      console.log(`Skipping self-view tracking for RFP ${rfpId} by owner ${req.user.id}`);
      return res.status(200).json({ skipped: true, message: "Self-view not tracked" });
    }
    
    // Add trackRfpView to storage implementation if missing
    if (!storage.trackRfpView) {
      return res.status(501).json({ message: "View tracking not implemented" });
    }
    
    const viewSession = await storage.trackRfpView(rfpId, req.user.id, duration);
    
    res.json({ success: true, viewSession });
  } catch (error) {
    console.error('Error tracking RFP view:', error);
    res.status(500).json({ message: "Failed to track view" });
  }
});

// Payment routes
const FEATURED_RFP_PRICE = 2500; // $25.00 (in cents)

// Get featured RFP pricing
app.get('/api/payments/price', (req, res) => {
  res.json({ price: FEATURED_RFP_PRICE });
});

// Create payment intent for featuring an RFP
app.post('/api/payments/create-payment-intent', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

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

    // In a full implementation, this would create a payment intent with Stripe
    // For simplicity in entrypoint.js, we'll return a mock client secret
    
    const mockPaymentIntent = {
      id: `pi_${Date.now()}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`,
      amount: FEATURED_RFP_PRICE,
    };

    res.json({
      clientSecret: mockPaymentIntent.client_secret,
      amount: mockPaymentIntent.amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create payment intent"
    });
  }
});

// Confirm payment and update RFP featured status
app.post('/api/payments/confirm-payment', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { paymentIntentId, rfpId } = req.body;
    
    if (!paymentIntentId || !rfpId) {
      return res.status(400).json({ message: "Payment intent ID and RFP ID are required" });
    }

    // In a full implementation, this would verify the payment with Stripe
    // For entrypoint.js, we'll just update the RFP
    
    // Add updateRfp to storage implementation if missing
    if (!storage.updateRfp) {
      return res.status(501).json({ message: "RFP update not implemented" });
    }

    // Update the RFP to be featured
    const updatedRfp = await storage.updateRfp(Number(rfpId), {
      featured: true,
      featuredAt: new Date()
    });

    res.json({
      success: true,
      rfp: updatedRfp
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to confirm payment" 
    });
  }
});

// Get payment status
app.get('/api/payments/status/:paymentIntentId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { paymentIntentId } = req.params;
    
    // In a full implementation, this would get the payment intent from Stripe
    // For entrypoint.js, we'll just return a mock status
    
    res.json({
      id: paymentIntentId,
      status: 'succeeded',
      amount: FEATURED_RFP_PRICE,
      created: Date.now() / 1000,
      rfpId: req.query.rfpId || '1'
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to fetch payment status"
    });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${status} - ${message}`);
  res.status(status).json({ message });
});

// Handle static files

// Serve static files from dist/public 
const staticDir = path.join(process.cwd(), 'dist/public');
if (fs.existsSync(staticDir)) {
  console.log(`Serving static files from ${staticDir}`);
  app.use(express.static(staticDir));
  
  // For SPA routing, serve index.html for non-API routes that don't match a static file
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.warn(`index.html not found at ${indexPath}`);
      res.status(404).send('Application not found. Make sure to build the app first.');
    }
  });
} else {
  console.warn(`Static directory not found at ${staticDir}`);
}

// Start HTTP server for non-serverless environments
if (!process.env.VERCEL) {
  const PORT = 5000;
  const HOST = "0.0.0.0";
  
  // Create HTTP server
  const server = createServer(app);
  server.listen(PORT, HOST, () => {
    console.log(`Server started successfully on http://${HOST}:${PORT}`);
  });
}

// Export for serverless
export default app;