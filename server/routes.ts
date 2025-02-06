import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRfpSchema, insertBidSchema, insertEmployeeSchema } from "@shared/schema";

function requireAuth(req: Request) {
  if (!req.isAuthenticated()) {
    throw new Error("Unauthorized");
  }
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // RFP routes
  app.get("/api/rfps", async (req, res) => {
    const rfps = await storage.getRfps();
    res.json(rfps);
  });

  app.post("/api/rfps", async (req, res) => {
    requireAuth(req);
    if (req.user?.userType !== "government") {
      return res.status(403).send("Only government organizations can create RFPs");
    }
    
    const data = insertRfpSchema.parse(req.body);
    const rfp = await storage.createRfp({
      ...data,
      organizationId: req.user.id,
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
    if (req.user?.userType !== "contractor") {
      return res.status(403).send("Only contractors can submit bids");
    }
    
    const data = insertBidSchema.parse(req.body);
    const bid = await storage.createBid({
      ...data,
      rfpId: Number(req.params.id),
      contractorId: req.user.id,
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
    requireAuth(req);
    const employees = await storage.getEmployees(req.user!.id);
    res.json(employees);
  });

  app.post("/api/employees", async (req, res) => {
    requireAuth(req);
    const data = insertEmployeeSchema.parse(req.body);
    const employee = await storage.createEmployee({
      ...data,
      organizationId: req.user!.id,
    });
    res.status(201).json(employee);
  });

  app.delete("/api/employees/:id", async (req, res) => {
    requireAuth(req);
    await storage.deleteEmployee(Number(req.params.id));
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}
