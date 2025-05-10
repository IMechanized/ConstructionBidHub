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
    const rfpId = parseInt(req.params.id);
    const rfiData = {
      ...req.body,
      rfpId,
      organizationId: req.user?.id
    };
    
    const newRfi = await storage.createRfi(rfiData);
    res.status(201).json(newRfi);
  } catch (error) {
    console.error("Error creating RFI:", error);
    res.status(500).json({ error: "Failed to create RFI" });
  }
});

app.get("/api/rfis", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (email) {
      const rfis = await storage.getRfisByEmail(email);
      return res.json(rfis);
    }
    
    // If no email is provided and user is logged in, return all their RFIs
    if (req.user) {
      const rfis = await storage.getRfisByEmail(req.user.email);
      return res.json(rfis);
    }
    
    res.status(401).json({ error: "Unauthorized" });
  } catch (error) {
    console.error("Error getting RFIs:", error);
    res.status(500).json({ error: "Failed to fetch RFIs" });
  }
});

// Analytics routes
app.get("/api/analytics/rfp/:id", async (req, res) => {
  try {
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
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const analytics = await storage.getBoostedAnalytics(req.user.id);
    res.json(analytics);
  } catch (error) {
    console.error("Error getting boosted analytics:", error);
    res.status(500).json({ error: "Failed to fetch boosted analytics" });
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