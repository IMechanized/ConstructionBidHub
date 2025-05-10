import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth.js";
import { storage } from "./storage.js";
import { db } from "./db.js";
import path from "path";
import { insertRfpSchema, insertEmployeeSchema, onboardingSchema, insertRfiSchema, rfps, rfpAnalytics, rfpViewSessions } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { createPaymentIntent, verifyPayment } from './lib/stripe.js';
import paymentsRouter from './routes/payments.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for handling file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

function requireAuth(req: Request) {
  if (!req.isAuthenticated()) {
    throw new Error("Unauthorized");
  }
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);
  
  // Serve test login page
  app.get('/test-login', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'test-login.html'));
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      console.log('Upload request received');

      // Check authentication first
      try {
        requireAuth(req);
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

      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
        folder: 'construction-bids',
      });

      console.log('Upload successful:', result.secure_url);
      res.json({ url: result.secure_url });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upload file",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // RFP routes
  app.get("/api/rfps", async (req, res) => {
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
  });
  
  // Get featured RFPs
  app.get("/api/rfps/featured", async (req, res) => {
    try {
      const featuredRfps = await storage.getFeaturedRfps();
      
      // Add organization details to each RFP
      const rfpsWithOrgs = await Promise.all(
        featuredRfps.map(async (rfp) => {
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
      console.error('Error fetching featured RFPs:', error);
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
        return res.json({
          ...rfp,
          organization: null
        });
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
      console.error('Error fetching RFP:', error);
      res.status(500).json({ message: "Failed to fetch RFP" });
    }
  });

  // Protected RFP routes
  app.post("/api/rfps", async (req, res) => {
    try {
      requireAuth(req);
      console.log('RFP creation request received:', req.body);

      const data = insertRfpSchema.parse(req.body);
      console.log('Validated RFP data:', data);

      const rfp = await storage.createRfp({
        ...data,
        organizationId: req.user!.id,
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

  app.put("/api/rfps/:id", async (req, res) => {
    requireAuth(req);
    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp || rfp.organizationId !== req.user?.id) {
      return res.status(403).send("Unauthorized");
    }

    const updated = await storage.updateRfp(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/rfps/:id", async (req, res) => {
    requireAuth(req);
    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp || rfp.organizationId !== req.user?.id) {
      return res.status(403).send("Unauthorized");
    }

    await storage.deleteRfp(Number(req.params.id));
    res.sendStatus(200);
  });

  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      requireAuth(req);
      const employees = await storage.getEmployees(req.user!.id);
      res.json(employees);
    } catch (error) {
      res.status(401).json({ message: "Unauthorized access" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      requireAuth(req);
      const data = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee({
        ...data,
        organizationId: req.user!.id,
      });
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      requireAuth(req);
      const employee = await storage.getEmployee(Number(req.params.id));
      if (!employee || employee.organizationId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized: Employee does not belong to your organization" });
      }
      await storage.deleteEmployee(Number(req.params.id));
      res.sendStatus(200);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Update user settings
  app.post("/api/user/settings", async (req, res) => {
    requireAuth(req);
    const user = req.user!;

    try {
      const updatedUser = await storage.updateUser(user.id, {
        ...req.body,
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Failed to update settings" });
    }
  });

  // Deactivate user account
  app.post("/api/user/deactivate", async (req, res) => {
    requireAuth(req);
    const user = req.user!;

    try {
      const updatedUser = await storage.updateUser(user.id, {
        status: "deactivated",
      });
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging out" });
        }
        res.json(updatedUser);
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to deactivate account" });
    }
  });

  // Delete user account
  app.delete("/api/user", async (req, res) => {
    requireAuth(req);
    const user = req.user!;

    try {
      await storage.deleteUser(user.id);
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete account" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/boosted", async (req, res) => {
    try {
      requireAuth(req);
      const user = req.user!;
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

  app.post("/api/analytics/track-view", async (req, res) => {
    try {
      requireAuth(req);
      const { rfpId, duration } = req.body;
      
      console.log(`Tracking view for RFP ${rfpId} with duration ${duration}s by user ${req.user!.id}`);
      
      // Fetch the RFP to verify it exists
      const rfp = await storage.getRfpById(rfpId);
      if (!rfp) {
        console.error(`RFP ${rfpId} not found`);
        return res.status(404).json({ message: "RFP not found" });
      }
      
      // Skip tracking if the viewer is the RFP owner (don't count self-views)
      if (rfp.organizationId === req.user!.id) {
        console.log(`Skipping self-view tracking for RFP ${rfpId} by owner ${req.user!.id}`);
        return res.status(200).json({ skipped: true, message: "Self-view not tracked" });
      }
      
      // Insert view session directly to ensure it works
      const today = new Date().toISOString().split('T')[0];
      const [viewSession] = await db
        .insert(rfpViewSessions)
        .values({
          rfpId,
          userId: req.user!.id,
          viewDate: new Date(),
          duration,
        })
        .returning();
        
      console.log(`View session created: ${JSON.stringify(viewSession)}`);
      
      // Check if analytics record exists for today
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
        // Update existing analytics
        console.log(`Updating existing analytics for RFP ${rfpId}`);
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
        // Create new analytics
        console.log(`Creating new analytics for RFP ${rfpId}`);
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
      console.error('Error tracking RFP view:', error);
      res.status(500).json({ message: "Failed to track view" });
    }
  });

  app.get("/api/analytics/rfp/:id", async (req, res) => {
    try {
      requireAuth(req);
      const analytics = await storage.getAnalyticsByRfpId(Number(req.params.id));
      if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
      }
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching RFP analytics:', error);
      res.status(500).json({ message: "Failed to fetch RFP analytics" });
    }
  });

  // Update the RFI endpoint
  app.post("/api/rfps/:id/rfi", async (req, res) => {
    try {
      requireAuth(req);  // Make sure user is authenticated
      const data = insertRfiSchema.parse(req.body);

      const rfp = await storage.getRfpById(Number(req.params.id));
      if (!rfp) {
        return res.status(404).json({ message: "RFP not found" });
      }

      // Use the authenticated user's email
      const rfi = await storage.createRfi({
        ...data,
        email: req.user!.email,  // Use authenticated user's email
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

  // Get RFIs for specific RFP
  app.get("/api/rfps/:id/rfi", async (req, res) => {
    try {
      // Get RFIs with organization data in a single query
      const rfis = await storage.getRfisByRfp(Number(req.params.id));
      res.json(rfis);
    } catch (error) {
      console.error('Error fetching RFIs for RFP:', error);
      res.status(500).json({ message: "Failed to fetch RFIs" });
    }
  });

  // Get RFIs for current user
  app.get("/api/rfis", async (req, res) => {
    try {
      // Add debug logging
      console.log('GET /api/rfis - Auth status:', req.isAuthenticated());
      console.log('GET /api/rfis - User:', req.user);

      if (!req.isAuthenticated()) {
        console.log('User not authenticated, returning 401');
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user!;
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
      console.error('Error fetching RFIs:', error);
      res.status(500).json({ message: "Failed to fetch RFIs" });
    }
  });

  // User onboarding endpoint
  app.post("/api/user/onboarding", async (req, res) => {
    try {
      requireAuth(req);
      console.log("Onboarding request received:", req.body);

      // Validate onboarding data
      const data = onboardingSchema.parse(req.body);
      console.log("Validated onboarding data:", data);

      // Update user profile
      const updatedUser = await storage.updateUser(req.user!.id, {
        ...data,
        onboardingComplete: true,
      });

      console.log("User profile updated successfully:", updatedUser);
      res.json(updatedUser);
    } catch (error) {
      console.error("Onboarding error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to complete onboarding" });
      }
    }
  });

  // Add this new route before the registerRoutes function return statement
  app.put("/api/rfps/:rfpId/rfi/:rfiId/status", async (req, res) => {
    try {
      requireAuth(req);

      const rfpId = Number(req.params.rfpId);
      const rfiId = Number(req.params.rfiId);
      const { status } = req.body;
      
      // Validate status is one of the allowed values
      if (status !== "pending" && status !== "responded") {
        return res.status(400).json({ message: "Invalid status value. Must be 'pending' or 'responded'" });
      }

      // Verify the RFP belongs to the current user
      const rfp = await storage.getRfpById(rfpId);
      if (!rfp || rfp.organizationId !== req.user?.id) {
        return res.status(403).json({ message: "Unauthorized to update this RFI" });
      }

      // Update RFI status
      const updatedRfi = await storage.updateRfiStatus(rfiId, status);
      res.json(updatedRfi);
    } catch (error) {
      console.error('Error updating RFI status:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update RFI status"
      });
    }
  });

  // Payment routes
  app.post("/api/payments/create-payment-intent", async (req, res) => {
    try {
      requireAuth(req);
      
      const { rfpId } = req.body;
      if (!rfpId) {
        return res.status(400).json({ message: "RFP ID is required" });
      }
      
      // Verify the RFP belongs to the current user
      const rfp = await storage.getRfpById(Number(rfpId));
      if (!rfp || rfp.organizationId !== req.user?.id) {
        return res.status(403).json({ message: "Unauthorized to feature this RFP" });
      }
      
      // Create payment intent with Stripe
      const paymentIntent = await createPaymentIntent({
        rfpId: String(rfpId),
        userId: String(req.user!.id),
        rfpTitle: rfp.title
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
  
  app.post("/api/payments/confirm-payment", async (req, res) => {
    try {
      requireAuth(req);
      
      const { paymentIntentId, rfpId } = req.body;
      if (!paymentIntentId || !rfpId) {
        return res.status(400).json({ message: "Payment intent ID and RFP ID are required" });
      }
      
      // Verify payment was successful
      const paymentVerified = await verifyPayment(paymentIntentId);
      if (!paymentVerified) {
        return res.status(400).json({ message: "Payment verification failed" });
      }
      
      // Verify the RFP belongs to the current user
      const rfp = await storage.getRfpById(Number(rfpId));
      if (!rfp || rfp.organizationId !== req.user?.id) {
        return res.status(403).json({ message: "Unauthorized to feature this RFP" });
      }
      
      // Update RFP to be featured
      const updatedRfp = await storage.updateRfp(Number(rfpId), { 
        featured: true
      });
      
      res.json({
        success: true,
        message: "Payment confirmed and RFP featured successfully",
        rfp: updatedRfp
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to confirm payment"
      });
    }
  });

  // Register the payments router
  app.use('/api/payments', paymentsRouter);

  const httpServer = createServer(app);
  return httpServer;
}