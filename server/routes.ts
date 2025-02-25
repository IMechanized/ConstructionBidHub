import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRfpSchema, insertBidSchema, insertEmployeeSchema, onboardingSchema } from "@shared/schema";

function requireAuth(req: Request) {
  if (!req.isAuthenticated()) {
    throw new Error("Unauthorized");
  }
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // New onboarding endpoint
  app.post("/api/user/onboarding", async (req, res) => {
    requireAuth(req);
    const user = req.user!;

    try {
      // Validate the data with unified onboarding schema
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
    res.json(rfps);
  });

  app.post("/api/rfps", async (req, res) => {
    requireAuth(req);

    const data = insertRfpSchema.parse(req.body);
    const rfp = await storage.createRfp({
      ...data,
      organizationId: req.user!.id,
    });
    res.status(201).json(rfp);
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

  const httpServer = createServer(app);
  return httpServer;
}