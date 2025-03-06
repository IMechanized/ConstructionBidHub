import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRfpSchema, insertBidSchema, insertEmployeeSchema, onboardingSchema } from "@shared/schema";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

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

  // New onboarding endpoint
  app.post("/api/user/onboarding", async (req, res) => {
    requireAuth(req);
    const user = req.user!;

    try {
      onboardingSchema.parse(req.body);

      const updatedUser = await storage.updateUser(user.id, {
        ...req.body,
        onboardingComplete: true,
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid data provided" });
    }
  });

  // RFP routes
  app.get("/api/rfps", async (req, res) => {
    const rfps = await storage.getRfps();
    const rfpsWithOrgs = await Promise.all(
      rfps.map(async (rfp) => {
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

  app.get("/api/rfps/:id", async (req, res) => {
    try {
      const rfp = await storage.getRfpById(Number(req.params.id));
      if (!rfp) {
        return res.status(404).json({ message: "RFP not found" });
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

  // Bid routes
  app.get("/api/rfps/:id/bids", async (req, res) => {
    requireAuth(req);
    const bids = await storage.getBids(Number(req.params.id));
    res.json(bids);
  });

  // New endpoint to get all bids for current user
  app.get("/api/bids", async (req, res) => {
    try {
      requireAuth(req);
      const bids = await storage.getBidsByContractor(req.user!.id);
      res.json(bids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.post("/api/rfps/:id/bids", async (req, res) => {
    requireAuth(req);

    // Check if user is trying to bid on their own RFP
    const rfp = await storage.getRfpById(Number(req.params.id));
    if (!rfp) {
      return res.status(404).send("RFP not found");
    }
    if (rfp.organizationId === req.user!.id) {
      return res.status(403).send("Cannot bid on your own RFP");
    }

    const data = insertBidSchema.parse(req.body);
    const bid = await storage.createBid({
      ...data,
      rfpId: Number(req.params.id),
      contractorId: req.user!.id,
    });
    res.status(201).json(bid);
  });

  app.delete("/api/bids/:id", async (req, res) => {
    requireAuth(req);
    await storage.deleteBid(Number(req.params.id));
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
      const analytics = await storage.getBoostedAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching boosted analytics:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics/track-view", async (req, res) => {
    try {
      requireAuth(req);
      const { rfpId, duration } = req.body;
      const viewSession = await storage.trackRfpView(rfpId, req.user!.id, duration);
      res.json(viewSession);
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

  // Add RFI endpoint
  app.post("/api/rfps/:id/rfi", async (req, res) => {
    try {
      const { email, message } = req.body;

      // Validate input
      if (!email || !message) {
        return res.status(400).json({ message: "Email and message are required" });
      }

      // Get the RFP to include its title in the response
      const rfp = await storage.getRfpById(Number(req.params.id));
      if (!rfp) {
        return res.status(404).json({ message: "RFP not found" });
      }

      // In a real application, you would:
      // 1. Store the RFI in the database
      // 2. Send an email notification
      // For now, we'll just return success

      res.status(200).json({ 
        message: "Request for information submitted successfully",
        rfpTitle: rfp.title
      });
    } catch (error) {
      console.error('Error submitting RFI:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to submit RFI"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}