const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const pgSession = require('connect-pg-simple')(session);
const Stripe = require('stripe');

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000;

// Database pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure Stripe with proper error handling
let stripe = null;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

try {
  if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
    stripe = new Stripe(stripeSecretKey);
    console.log('✅ Stripe initialized successfully');
  } else {
    console.error('❌ Invalid Stripe secret key format');
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error);
}

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure the local strategy for Passport
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await storage.getUserByUsername(email);
      if (!user) {
        return done(null, false, { message: 'Incorrect email or password' });
      }
      
      const match = await comparePasswords(password, user.passwordHash);
      if (!match) {
        return done(null, false, { message: 'Incorrect email or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize and deserialize user
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

// Compare passwords
async function comparePasswords(supplied, stored) {
  return bcrypt.compare(supplied, stored);
}

// Require authentication middleware
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

// Utility function to convert camelCase to snake_case
function snakeCaseKey(key) {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// Mock storage implementation for entrypoint.js
const storage = {
  async getUser(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },
  
  async updateUser(id, updates) {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    
    const setString = keys.map((key, i) => `${snakeCaseKey(key)} = $${i + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE users SET ${setString} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    return result.rows[0];
  },
  
  async getUserByUsername(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },
  
  async getRfps() {
    const result = await pool.query('SELECT * FROM rfps ORDER BY created_at DESC');
    return result.rows;
  },
  
  async getRfpById(id) {
    const result = await pool.query('SELECT * FROM rfps WHERE id = $1', [id]);
    return result.rows[0];
  },
  
  async getFeaturedRfps() {
    const result = await pool.query('SELECT * FROM rfps WHERE featured = TRUE ORDER BY featured_at DESC');
    return result.rows;
  },
  
  async createRfp(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(key => snakeCaseKey(key)).join(', ');
    
    const result = await pool.query(
      `INSERT INTO rfps (${columns}) VALUES (${placeholders}) RETURNING *`,
      Object.values(data)
    );
    
    return result.rows[0];
  },
  
  async updateRfp(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setString = keys.map((key, i) => `${snakeCaseKey(key)} = $${i + 2}`).join(', ');
    
    const result = await pool.query(
      `UPDATE rfps SET ${setString} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    return result.rows[0];
  },
  
  async deleteRfp(id) {
    await pool.query('DELETE FROM rfps WHERE id = $1', [id]);
  },
  
  async getRfisByRfp(rfpId) {
    const result = await pool.query(
      `SELECT r.*, u.company_name as organization_name 
       FROM rfis r 
       LEFT JOIN users u ON r.organization_id = u.id 
       WHERE r.rfp_id = $1 
       ORDER BY r.created_at DESC`,
      [rfpId]
    );
    
    return result.rows.map(row => {
      const { organization_name, ...rfi } = row;
      return {
        ...rfi,
        organization: organization_name ? { companyName: organization_name } : undefined
      };
    });
  },
  
  async getRfisByEmail(email) {
    const result = await pool.query(
      `SELECT r.* FROM rfis r WHERE r.contact_email = $1 ORDER BY r.created_at DESC`,
      [email]
    );
    
    return result.rows;
  },
  
  async createRfi(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(key => snakeCaseKey(key)).join(', ');
    
    const result = await pool.query(
      `INSERT INTO rfis (${columns}) VALUES (${placeholders}) RETURNING *`,
      Object.values(data)
    );
    
    return result.rows[0];
  },
  
  async updateRfiStatus(rfiId, status) {
    const result = await pool.query(
      'UPDATE rfis SET status = $1 WHERE id = $2 RETURNING *',
      [status, rfiId]
    );
    
    return result.rows[0];
  },
  
  async getAnalyticsByRfpId(rfpId) {
    const result = await pool.query('SELECT * FROM rfp_analytics WHERE rfp_id = $1', [rfpId]);
    return result.rows[0];
  },
  
  async getBoostedAnalytics(userId) {
    const result = await pool.query(
      `SELECT a.*, r.* 
       FROM rfp_analytics a 
       JOIN rfps r ON a.rfp_id = r.id 
       WHERE r.organization_id = $1 AND r.featured = TRUE`,
      [userId]
    );
    
    return result.rows.map(row => {
      const { id, rfp_id, date, total_views, unique_views, average_view_time, total_bids, click_through_rate, ...rfp } = row;
      
      return {
        id, 
        rfpId: rfp_id, 
        date, 
        totalViews: total_views, 
        uniqueViews: unique_views,
        averageViewTime: average_view_time,
        totalBids: total_bids,
        clickThroughRate: click_through_rate,
        rfp
      };
    });
  },
  
  async trackRfpView(rfpId, userId, duration) {
    // Create a new RFP view session
    const sessionResult = await pool.query(
      `INSERT INTO rfp_view_sessions (rfp_id, user_id, view_date, duration)
       VALUES ($1, $2, NOW(), $3)
       RETURNING *`,
      [rfpId, userId, duration]
    );

    // Upsert RFP analytics for today
    const today = new Date().toISOString().split('T')[0];
    
    // Check if analytics entry exists for today
    const analyticsCheck = await pool.query(
      `SELECT * FROM rfp_analytics
       WHERE rfp_id = $1 AND date = $2`,
      [rfpId, today]
    );
    
    if (analyticsCheck.rows.length > 0) {
      // Update existing analytics
      const analytics = analyticsCheck.rows[0];
      await pool.query(
        `UPDATE rfp_analytics
         SET total_views = total_views + 1,
             unique_views = (
               SELECT COUNT(DISTINCT user_id) 
               FROM rfp_view_sessions 
               WHERE rfp_id = $1 AND DATE(view_date) = $2
             ),
             average_view_time = (
               SELECT AVG(duration)
               FROM rfp_view_sessions
               WHERE rfp_id = $1 AND DATE(view_date) = $2
             )
         WHERE id = $3
         RETURNING *`,
        [rfpId, today, analytics.id]
      );
    } else {
      // Create new analytics entry
      await pool.query(
        `INSERT INTO rfp_analytics (rfp_id, date, total_views, unique_views, average_view_time)
         VALUES (
           $1, 
           $2, 
           1, 
           1, 
           $3
         )`,
        [rfpId, today, duration]
      );
    }
    
    return sessionResult.rows[0];
  },
  
  async getEmployees(organizationId) {
    const result = await pool.query(
      'SELECT * FROM employees WHERE organization_id = $1 ORDER BY created_at DESC',
      [organizationId]
    );
    return result.rows;
  },
  
  async getEmployee(id) {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    return result.rows[0];
  },
  
  async createEmployee(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(key => snakeCaseKey(key)).join(', ');
    
    const result = await pool.query(
      `INSERT INTO employees (${columns}) VALUES (${placeholders}) RETURNING *`,
      Object.values(data)
    );
    
    return result.rows[0];
  },
  
  async deleteEmployee(id) {
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
  },
  
  async deleteUser(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  },
  
  get sessionStore() {
    return new pgSession({
      pool,
      tableName: 'session'
    });
  }
};

// Set Stripe price constant
const FEATURED_RFP_PRICE = 2500; // $25.00 (in cents)

// API Routes

// File upload endpoint
app.post("/api/upload", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // In entrypoint.js, we'll use a simplified approach since multer isn't set up
    res.status(400).json({ message: "File upload not supported in entrypoint.js" });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to upload file"
    });
  }
});

// User routes
app.get("/api/user", requireAuth, (req, res) => {
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

app.post("/api/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.json({ success: true });
  });
});

// User onboarding
app.post("/api/user/onboarding", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Update user with onboarding data
    const updatedUser = await storage.updateUser(req.user.id, {
      ...req.body,
      onboardingComplete: true
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error during onboarding:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to complete onboarding"
    });
  }
});

// Update user settings
app.post("/api/user/settings", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const updatedUser = await storage.updateUser(req.user.id, {
      ...req.body,
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(400).json({ message: "Failed to update settings" });
  }
});

// Deactivate user account
app.post("/api/user/deactivate", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const updatedUser = await storage.updateUser(req.user.id, {
      status: "deactivated",
    });
    
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json(updatedUser);
    });
  } catch (error) {
    console.error('Error deactivating account:', error);
    res.status(400).json({ message: "Failed to deactivate account" });
  }
});

// Delete user account
app.delete("/api/user", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    await storage.deleteUser(req.user.id);
    
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ message: "Account deleted successfully" });
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(400).json({ message: "Failed to delete account" });
  }
});

// RFP routes
app.get("/api/rfps", async (req, res) => {
  try {
    const rfps = await storage.getRfps();
    res.json(rfps);
  } catch (error) {
    console.error("Error fetching RFPs:", error);
    res.status(500).json({ message: "Error fetching RFPs" });
  }
});

app.get("/api/rfps/featured", async (req, res) => {
  try {
    const rfps = await storage.getFeaturedRfps();
    res.json(rfps);
  } catch (error) {
    console.error("Error fetching featured RFPs:", error);
    res.status(500).json({ message: "Error fetching featured RFPs" });
  }
});

app.get("/api/rfps/:id", async (req, res) => {
  try {
    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    res.json(rfp);
  } catch (error) {
    console.error("Error fetching RFP:", error);
    res.status(500).json({ message: "Error fetching RFP" });
  }
});

app.post("/api/rfps", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfp = await storage.createRfp({
      ...req.body,
      organizationId: req.user.id,
    });
    
    res.status(201).json(rfp);
  } catch (error) {
    console.error("Error creating RFP:", error);
    res.status(500).json({ message: "Error creating RFP" });
  }
});

app.put("/api/rfps/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp || rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const updated = await storage.updateRfp(Number(req.params.id), req.body);
    res.json(updated);
  } catch (error) {
    console.error("Error updating RFP:", error);
    res.status(500).json({ message: "Error updating RFP" });
  }
});

app.delete("/api/rfps/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp || rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    await storage.deleteRfp(Number(req.params.id));
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting RFP:", error);
    res.status(500).json({ message: "Error deleting RFP" });
  }
});

// Employee routes
app.get("/api/employees", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const employees = await storage.getEmployees(req.user.id);
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const employee = await storage.createEmployee({
      ...req.body,
      organizationId: req.user.id,
    });
    
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create employee" 
    });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const employee = await storage.getEmployee(Number(req.params.id));
    if (!employee || employee.organizationId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized: Employee does not belong to your organization" });
    }
    
    await storage.deleteEmployee(Number(req.params.id));
    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to delete employee" 
    });
  }
});

// RFI routes
app.get("/api/rfis/rfp/:rfpId", async (req, res) => {
  try {
    const rfis = await storage.getRfisByRfp(Number(req.params.rfpId));
    res.json(rfis);
  } catch (error) {
    console.error("Error fetching RFIs:", error);
    res.status(500).json({ message: "Error fetching RFIs" });
  }
});

app.post("/api/rfis", async (req, res) => {
  try {
    const rfi = await storage.createRfi(req.body);
    res.status(201).json(rfi);
  } catch (error) {
    console.error("Error creating RFI:", error);
    res.status(500).json({ message: "Error creating RFI" });
  }
});

// Get RFIs for current user
app.get("/api/rfis", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user;
    const userRfis = await storage.getRfisByEmail(user.email);

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

    res.json(rfisWithRfp);
  } catch (error) {
    console.error('Error fetching RFIs:', error);
    res.status(500).json({ message: "Failed to fetch RFIs" });
  }
});

// Update RFI status
app.put("/api/rfps/:rfpId/rfi/:rfiId/status", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const { status } = req.body;
    if (!status || !['pending', 'responded'].includes(status)) {
      return res.status(400).json({ message: "Valid status (pending or responded) is required" });
    }
    
    const rfpId = Number(req.params.rfpId);
    const rfiId = Number(req.params.rfiId);
    
    // Verify the RFP exists and belongs to this user
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    
    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only update RFIs for your own RFPs" });
    }
    
    // Update the RFI status
    const updatedRfi = await storage.updateRfiStatus(rfiId, status);
    
    res.json(updatedRfi);
  } catch (error) {
    console.error('Error updating RFI status:', error);
    res.status(500).json({ message: "Failed to update RFI status" });
  }
});

// Post RFI for specific RFP
app.post("/api/rfps/:id/rfi", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    
    // Use the authenticated user's email
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
    console.error('Error submitting RFI:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to submit RFI"
    });
  }
});

// Analytics routes
app.get("/api/analytics/rfp/:rfpId", requireAuth, async (req, res) => {
  try {
    const rfpId = Number(req.params.rfpId);
    
    // Verify the RFP exists and belongs to this user
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json({ message: "RFP not found" });
    }
    
    if (rfp.organizationId !== req.user.id) {
      return res.status(403).json({ message: "You can only view analytics for your own RFPs" });
    }
    
    const analytics = await storage.getAnalyticsByRfpId(rfpId);
    res.json(analytics || { rfpId, totalViews: 0, uniqueViews: 0, averageViewTime: 0 });
  } catch (error) {
    console.error("Error fetching RFP analytics:", error);
    res.status(500).json({ message: "Error fetching RFP analytics" });
  }
});

app.get("/api/analytics/boosted", requireAuth, async (req, res) => {
  try {
    const analytics = await storage.getBoostedAnalytics(req.user.id);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching featured RFP analytics:", error);
    res.status(500).json({ message: "Error fetching featured RFP analytics" });
  }
});

app.post("/api/analytics/track-view", async (req, res) => {
  try {
    const { rfpId, userId, duration } = req.body;
    
    if (!rfpId || !userId || duration === undefined) {
      return res.status(400).json({ message: "RFP ID, user ID, and duration are required" });
    }
    
    const viewSession = await storage.trackRfpView(Number(rfpId), Number(userId), Number(duration));
    res.status(201).json(viewSession);
  } catch (error) {
    console.error("Error tracking RFP view:", error);
    res.status(500).json({ message: "Error tracking RFP view" });
  }
});

// Payment routes
app.get('/api/payments/price', (req, res) => {
  res.json({ price: FEATURED_RFP_PRICE });
});

app.get('/api/payments/config', (req, res) => {
  res.json({ 
    isInitialized: Boolean(stripe),
    mode: process.env.NODE_ENV || 'development',
    keyType: stripeSecretKey?.startsWith('sk_test_') ? 'test' : 'live'
  });
});

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

    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not initialized. Please check your API keys." });
    }
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: FEATURED_RFP_PRICE,
      currency: 'usd',
      metadata: {
        rfpId: String(rfpId),
        userId: String(req.user.id),
        rfpTitle: rfp.title
      },
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Featured RFP: ${rfp.title.substring(0, 50)}...`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to create payment intent"
    });
  }
});

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

    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not initialized. Please check your API keys." });
    }

    // Verify payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const paymentVerified = paymentIntent?.status === 'succeeded';
    
    if (!paymentVerified) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update RFP to be featured
    const updatedRfp = await storage.updateRfp(Number(rfpId), {
      featured: true,
      featuredAt: new Date()
    });

    // Return success and the updated RFP
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

app.get('/api/payments/status/:paymentIntentId', requireAuth, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!stripe) {
      // In a simplified entrypoint.js, just return a mock status
      return res.json({
        id: paymentIntentId,
        status: 'succeeded',
        amount: FEATURED_RFP_PRICE,
        created: Date.now() / 1000,
        rfpId: req.query.rfpId || '1'
      });
    }

    // Get the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({ message: "Payment intent not found" });
    }

    // Return the payment status
    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch payment status"
    });
  }
});

// Cancel payment intent
app.post('/api/payments/cancel-payment', requireAuth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment intent ID is required" });
    }
    
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not initialized. Please check your API keys." });
    }
    
    // Get the payment intent to verify ownership
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return res.status(404).json({ message: "Payment intent not found" });
    }
    
    // Verify the payment belongs to this user
    if (paymentIntent.metadata.userId !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only cancel your own payments" });
    }
    
    // Cancel the payment intent
    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    
    res.json({
      success: true,
      status: canceledIntent.status,
      message: "Payment cancelled successfully"
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to cancel payment"
    });
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;