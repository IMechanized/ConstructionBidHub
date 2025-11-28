import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth.js";
import { createSession } from "./session.js";
import { storage } from "./storage.js";
import { db } from "./db.js";
import { insertRfpSchema, onboardingSchema, insertRfiSchema, insertNotificationSchema, rfps, rfpAnalytics, rfpViewSessions } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import multer from 'multer';
import { uploadImageToS3, uploadDocumentToS3, uploadAttachmentToS3 } from './lib/s3.js';
import { createPaymentIntent, verifyPayment } from './lib/stripe.js';
import { deadlineMonitor } from './services/deadline-monitor.js';
import cookie from 'cookie';
import cookieSignature from 'cookie-signature';
import { getSessionSecret } from './lib/session-config';
import helmet from 'helmet';
import { sendErrorResponse, ErrorMessages, getSafeValidationMessage } from './lib/error-handler.js';
import { logAuthenticationFailure, logAuthorizationFailure } from './lib/security-audit.js';
import { validatePositiveInt, validateRouteParams } from './lib/param-validation.js';

// Configure multer for handling file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Helper function for checking auth within route handlers
function requireAuth(req: Request, res?: Response) {
  if (!req.isAuthenticated()) {
    // Always log authentication failure for audit trail
    logAuthenticationFailure(req.path, req);
    
    if (res) {
      // If response object is provided, send sanitized 401
      sendErrorResponse(res, new Error('Unauthorized'), 401, ErrorMessages.UNAUTHORIZED, 'Auth');
      return false;
    }
    throw new Error("Unauthorized");
  }
  return true;
}

export function registerRoutes(app: Express): Server {
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
          "https://*.s3.*.amazonaws.com",
          "https://*.s3.amazonaws.com",
          "https://s3.*.amazonaws.com"
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
          "https://*.s3.*.amazonaws.com",
          "https://*.s3.amazonaws.com",
          "https://s3.*.amazonaws.com"
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
  
  // Initialize session middleware first (required for authentication)
  createSession(app);
  
  // Then initialize authentication (depends on session)
  setupAuth(app);

  // File upload endpoint for images
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      console.log('Upload request received');

      // Check authentication first
      try {
        requireAuth(req);
      } catch (error) {
        return sendErrorResponse(res, error, 401, ErrorMessages.UNAUTHORIZED, 'UploadAuth');
      }

      if (!req.file) {
        return sendErrorResponse(res, new Error('No file'), 400, ErrorMessages.BAD_REQUEST, 'UploadNoFile');
      }

      if (!req.file.mimetype.startsWith('image/')) {
        return sendErrorResponse(res, new Error('Invalid file type'), 400, ErrorMessages.BAD_REQUEST, 'UploadInvalidType');
      }

      console.log('File received:', req.file.originalname, req.file.mimetype);

      // Upload to S3 with user-specific folder
      const url = await uploadImageToS3(req.file.buffer, req.file.originalname, req.user!.id);

      console.log('Upload successful:', url);
      res.json({ url });
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.UPLOAD_FAILED, 'Upload');
    }
  });

  // Document upload endpoint for RFP documents
  app.post("/api/upload-document", upload.single('file'), async (req, res) => {
    try {
      console.log('Document upload request received');

      // Check authentication first
      try {
        requireAuth(req);
      } catch (error) {
        return sendErrorResponse(res, error, 401, ErrorMessages.UNAUTHORIZED, 'UploadAuth');
      }

      if (!req.file) {
        return sendErrorResponse(res, new Error('No file'), 400, ErrorMessages.BAD_REQUEST, 'UploadNoFile');
      }

      // Allowed document types: PDF, Word, Excel, text files
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return sendErrorResponse(res, new Error('Invalid file type. Allowed: PDF, Word, Excel, Text'), 400, ErrorMessages.BAD_REQUEST, 'UploadInvalidType');
      }

      console.log('Document received:', req.file.originalname, req.file.mimetype);

      // Upload to S3 with user-specific folder
      const url = await uploadDocumentToS3(req.file.buffer, req.file.originalname, req.file.mimetype, req.user!.id);

      console.log('Document upload successful:', url);
      res.json({ 
        url,
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      });
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.UPLOAD_FAILED, 'DocumentUpload');
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
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'FeaturedRFPs');
    }
  });

  app.get("/api/rfps/:id", async (req, res) => {
    try {
      const id = validatePositiveInt(req.params.id, 'RFP ID', res);
      if (id === null) return;

      const rfp = await storage.getRfpById(id);
      if (!rfp) {
        return sendErrorResponse(res, new Error('RFP not found'), 404, ErrorMessages.NOT_FOUND, 'RFPNotFound');
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
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'RFP');
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
      const safeMessage = getSafeValidationMessage(error);
      sendErrorResponse(res, error, 400, safeMessage || ErrorMessages.CREATE_FAILED, 'RFPCreation');
    }
  });

  app.put("/api/rfps/:id", async (req, res) => {
    try {
      requireAuth(req);
      console.log('RFP update request received:', req.body);

      const id = validatePositiveInt(req.params.id, 'RFP ID', res);
      if (id === null) return;

      const rfp = await storage.getRfpById(id);
      if (!rfp || rfp.organizationId !== req.user?.id) {
        logAuthorizationFailure(req.user?.id, `RFP ${req.params.id}`, 'update', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFPUpdate');
      }

      // Validate the update data using the insert schema but make all fields optional
      const data = insertRfpSchema.partial().parse(req.body);
      console.log('Validated RFP update data:', data);

      // Convert date strings to Date objects for storage
      const processedData = {
        ...data,
        walkthroughDate: data.walkthroughDate ? new Date(data.walkthroughDate) : undefined,
        rfiDate: data.rfiDate ? new Date(data.rfiDate) : undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      };

      const updated = await storage.updateRfp(id, processedData);
      console.log('RFP updated successfully:', updated);
      res.json(updated);
    } catch (error) {
      const safeMessage = getSafeValidationMessage(error);
      sendErrorResponse(res, error, 400, safeMessage || ErrorMessages.UPDATE_FAILED, 'RFPUpdate');
    }
  });

  app.delete("/api/rfps/:id", async (req, res) => {
    requireAuth(req);
    
    const id = validatePositiveInt(req.params.id, 'RFP ID', res);
    if (id === null) return;
    
    const rfp = await storage.getRfpById(id);
    if (!rfp || rfp.organizationId !== req.user?.id) {
      logAuthorizationFailure(req.user?.id, `RFP ${req.params.id}`, 'delete', req);
      return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFPDelete');
    }

    await storage.deleteRfp(id);
    res.sendStatus(200);
  });

  // RFP Document routes
  app.get("/api/rfps/:id/documents", async (req, res) => {
    try {
      const id = validatePositiveInt(req.params.id, 'RFP ID', res);
      if (id === null) return;

      const documents = await storage.getRfpDocuments(id);
      res.json(documents);
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'RFPDocuments');
    }
  });

  app.post("/api/rfps/:id/documents", async (req, res) => {
    try {
      requireAuth(req);
      
      const rfpId = validatePositiveInt(req.params.id, 'RFP ID', res);
      if (rfpId === null) return;

      // Verify the user owns this RFP
      const rfp = await storage.getRfpById(rfpId);
      if (!rfp || rfp.organizationId !== req.user?.id) {
        logAuthorizationFailure(req.user?.id, `RFP ${req.params.id}`, 'add document', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFPDocumentCreate');
      }

      const document = await storage.createRfpDocument({
        rfpId,
        filename: req.body.filename,
        fileUrl: req.body.fileUrl,
        documentType: req.body.documentType,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
      });

      res.status(201).json(document);
    } catch (error) {
      sendErrorResponse(res, error, 400, ErrorMessages.CREATE_FAILED, 'RFPDocumentCreate');
    }
  });

  app.delete("/api/rfp-documents/:id", async (req, res) => {
    try {
      requireAuth(req);
      
      const id = validatePositiveInt(req.params.id, 'Document ID', res);
      if (id === null) return;

      // Get the document to verify ownership
      const document = await storage.getRfpDocumentById(id);
      
      if (!document) {
        return sendErrorResponse(res, new Error('Document not found'), 404, ErrorMessages.NOT_FOUND, 'DocumentNotFound');
      }

      // Verify the user owns the RFP this document belongs to
      const rfp = await storage.getRfpById(document.rfpId);
      if (!rfp || rfp.organizationId !== req.user?.id) {
        logAuthorizationFailure(req.user?.id, `Document ${req.params.id}`, 'delete', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFPDocumentDelete');
      }

      await storage.deleteRfpDocument(id);
      res.sendStatus(200);
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.DELETE_FAILED, 'RFPDocumentDelete');
    }
  });

  // Download RFP document endpoint
  app.get("/api/rfp-documents/:id/download", async (req, res) => {
    try {
      const id = validatePositiveInt(req.params.id, 'Document ID', res);
      if (id === null) return;

      const document = await storage.getRfpDocumentById(id);
      if (!document) {
        return sendErrorResponse(res, new Error('Document not found'), 404, ErrorMessages.NOT_FOUND, 'DocumentNotFound');
      }

      // Fetch the file from S3
      const response = await fetch(document.fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch document from storage');
      }

      // Set headers to force download
      res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      
      // Stream the file to the response
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'RFPDocumentDownload');
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
      sendErrorResponse(res, error, 400, ErrorMessages.UPDATE_FAILED, 'UserSettings');
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
          return sendErrorResponse(res, err, 500, ErrorMessages.INTERNAL_ERROR, 'LogoutOnDeactivate');
        }
        res.json(updatedUser);
      });
    } catch (error) {
      sendErrorResponse(res, error, 400, ErrorMessages.UPDATE_FAILED, 'AccountDeactivation');
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
          return sendErrorResponse(res, err, 500, ErrorMessages.INTERNAL_ERROR, 'LogoutOnDelete');
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      sendErrorResponse(res, error, 400, ErrorMessages.DELETE_FAILED, 'AccountDeletion');
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
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'Analytics');
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
      sendErrorResponse(res, error, 500, ErrorMessages.CREATE_FAILED, 'TrackView');
    }
  });

  app.get("/api/analytics/rfp/:id", async (req, res) => {
    try {
      requireAuth(req);
      
      const id = validatePositiveInt(req.params.id, 'RFP ID', res);
      if (id === null) return;
      
      const analytics = await storage.getAnalyticsByRfpId(id);
      if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
      }
      res.json(analytics);
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'RFPAnalytics');
    }
  });

  // Update the RFI endpoint
  app.post("/api/rfps/:id/rfi", async (req, res) => {
    try {
      requireAuth(req);  // Make sure user is authenticated
      const data = insertRfiSchema.parse(req.body);

      const id = validatePositiveInt(req.params.id, 'RFP ID', res);
      if (id === null) return;
      
      const rfp = await storage.getRfpById(id);
      if (!rfp) {
        return sendErrorResponse(res, new Error('RFP not found'), 404, ErrorMessages.NOT_FOUND, 'RFPNotFound');
      }

      // Use the authenticated user's email
      const rfi = await storage.createRfi({
        ...data,
        email: req.user!.email,  // Use authenticated user's email
        rfpId: id,
      });

      res.status(201).json({ 
        message: "Request for information submitted successfully",
        rfi
      });
    } catch (error) {
      const safeMessage = getSafeValidationMessage(error);
      sendErrorResponse(res, error, 500, safeMessage || ErrorMessages.CREATE_FAILED, 'RFISubmission');
    }
  });

  // Get RFIs for specific RFP
  app.get("/api/rfps/:id/rfi", async (req, res) => {
    try {
      const id = validatePositiveInt(req.params.id, 'RFP ID', res);
      if (id === null) return;
      
      // Get RFIs with organization data in a single query
      const rfis = await storage.getRfisByRfp(id);
      res.json(rfis);
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'RFPRFIs');
    }
  });

  // Get RFIs for current user (RFIs they sent out)
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
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'UserRFIs');
    }
  });

  // Get RFIs on user's RFPs (RFIs they received)
  app.get("/api/rfis/received", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user!;
      console.log('Fetching received RFIs for user:', user.id);

      // Get all RFPs owned by this user
      const allRfps = await storage.getRfps();
      const userRfps = allRfps.filter(rfp => rfp.organizationId === user.id);
      console.log('Found user RFPs:', userRfps.length);

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

      console.log('Sending response with', allReceivedRfis.length, 'received RFIs');
      res.json(allReceivedRfis);
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'ReceivedRFIs');
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

      const params = validateRouteParams(req, res, { rfpId: 'positiveInt', rfiId: 'positiveInt' });
      if (!params) return;
      
      const rfpId = params.rfpId as number;
      const rfiId = params.rfiId as number;
      const { status } = req.body;
      
      // Validate status is one of the allowed values
      if (status !== "pending" && status !== "responded") {
        return res.status(400).json({ message: "Invalid status value. Must be 'pending' or 'responded'" });
      }

      // Verify the RFP belongs to the current user
      const rfp = await storage.getRfpById(rfpId);
      if (!rfp || rfp.organizationId !== req.user?.id) {
        logAuthorizationFailure(req.user?.id, `RFI ${rfiId}`, 'update', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFIUpdate');
      }

      // Get the RFI details before updating
      const rfis = await storage.getRfisByRfp(rfpId);
      const rfi = rfis.find(r => r.id === rfiId);
      
      if (!rfi) {
        return res.status(404).json({ message: "RFI not found" });
      }

      // Update RFI status
      const updatedRfi = await storage.updateRfiStatus(rfiId, status);
      
      // If status changed to "responded", create a notification for the RFI submitter
      if (status === "responded" && rfi.organization) {
        const notification = await storage.createNotification({
          userId: rfi.organization.id,
          type: "rfi_response",
          title: "RFI Response Available",
          message: `Your question about "${rfp.title}" has been answered.`,
          relatedId: rfiId,
          relatedType: "rfi"
        });
        
        // Send real-time notification
        if ((global as any).sendNotificationToUser) {
          (global as any).sendNotificationToUser(rfi.organization.id, notification);
        }
      }
      
      res.json(updatedRfi);
    } catch (error) {
      console.error('Error updating RFI status:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update RFI status"
      });
    }
  });

  // Bulk update RFI status
  app.put("/api/rfis/bulk-status", async (req, res) => {
    try {
      requireAuth(req);

      const { ids, status } = req.body;
      
      // Validate inputs
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "ids must be a non-empty array" });
      }
      
      if (status !== "pending" && status !== "responded") {
        return res.status(400).json({ message: "Invalid status value. Must be 'pending' or 'responded'" });
      }

      // Get all RFPs owned by the user
      const allRfps = await storage.getRfps();
      const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user!.id);
      const userRfpIds = userRfps.map(rfp => rfp.id);

      // Get all RFIs for user's RFPs
      const allUserRfis = await Promise.all(
        userRfpIds.map(rfpId => storage.getRfisByRfp(rfpId))
      );
      const flattenedRfis = allUserRfis.flat();
      
      // Verify all IDs belong to user's RFPs
      const validRfiIds = flattenedRfis.map(rfi => rfi.id);
      const unauthorizedIds = ids.filter(id => !validRfiIds.includes(id));
      
      if (unauthorizedIds.length > 0) {
        logAuthorizationFailure(req.user?.id, `RFIs ${unauthorizedIds.join(', ')}`, 'bulk update', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'BulkRFIUpdate');
      }

      // Perform bulk update
      const updatedRfis = await storage.bulkUpdateRfiStatus(ids, status);
      
      // Create notifications for responded RFIs if status changed to "responded"
      if (status === "responded") {
        for (const rfi of flattenedRfis.filter(r => ids.includes(r.id))) {
          if (rfi.organization) {
            const rfp = userRfps.find(r => r.id === rfi.rfpId);
            if (rfp) {
              const notification = await storage.createNotification({
                userId: rfi.organization.id,
                type: "rfi_response",
                title: "RFI Response Available",
                message: `Your question about "${rfp.title}" has been answered.`,
                relatedId: rfi.id,
                relatedType: "rfi"
              });
              
              // Send real-time notification
              if ((global as any).sendNotificationToUser) {
                (global as any).sendNotificationToUser(rfi.organization.id, notification);
              }
            }
          }
        }
      }
      
      res.json({ 
        message: `Successfully updated ${updatedRfis.length} RFI(s)`,
        updatedRfis 
      });
    } catch (error) {
      console.error('Error in bulk RFI status update:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to bulk update RFI status"
      });
    }
  });

  // RFI Conversation Endpoints
  
  // Get conversation messages for an RFI
  app.get("/api/rfis/:id/messages", async (req, res) => {
    try {
      requireAuth(req);
      const rfiId = Number(req.params.id);

      // Get the RFI details to check permissions
      const rfis = await storage.getRfisByEmail(req.user!.email);
      const contractorRfi = rfis.find(r => r.id === rfiId);
      
      // Check if user is the contractor who submitted the RFI
      let hasPermission = !!contractorRfi;
      
      // If not the contractor, check if they're the RFP owner
      if (!hasPermission) {
        // Find all RFPs by this user and their RFIs
        const allRfps = await storage.getRfps();
        const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user!.id);
        
        for (const rfp of userRfps) {
          const rfpRfis = await storage.getRfisByRfp(rfp.id);
          if (rfpRfis.some(r => r.id === rfiId)) {
            hasPermission = true;
            break;
          }
        }
      }

      if (!hasPermission) {
        logAuthorizationFailure(req.user?.id, `RFI ${rfiId} conversation`, 'view', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFIConversation');
      }

      const messages = await storage.getRfiMessages(rfiId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching RFI messages:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch RFI messages"
      });
    }
  });

  // Send a message in RFI conversation
  app.post("/api/rfis/:id/messages", upload.array('attachment', 5), async (req, res) => {
    try {
      requireAuth(req);
      
      const rfiId = validatePositiveInt(req.params.id, 'RFI ID', res);
      if (rfiId === null) return;
      
      const { message } = req.body;
      const files = req.files as Express.Multer.File[] || [];

      if ((!message || message.trim() === "") && files.length === 0) {
        return res.status(400).json({ message: "Message content or file attachment is required" });
      }

      // Get the RFI details to check permissions
      const rfis = await storage.getRfisByEmail(req.user!.email);
      const contractorRfi = rfis.find(r => r.id === rfiId);
      
      // Check if user is the contractor who submitted the RFI
      let hasPermission = !!contractorRfi;
      let targetUserId = null; // Who to notify
      
      // If not the contractor, check if they're the RFP owner
      if (!hasPermission) {
        const allRfps = await storage.getRfps();
        const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user!.id);
        
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
        logAuthorizationFailure(req.user?.id, `RFI ${rfiId}`, 'send message', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFIMessage');
      }

      // Create the message
      const newMessage = await storage.createRfiMessage({
        rfiId,
        senderId: req.user!.id,
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
            
            // Upload to S3 with user-specific folder
            const fileUrl = await uploadAttachmentToS3(file.buffer, sanitizedFilename, file.mimetype, req.user!.id);
            
            await storage.createRfiAttachment({
              messageId: newMessage.id,
              filename: sanitizedFilename,
              fileUrl,
              fileSize: file.size,
              mimeType: file.mimetype
            });
            
            console.log(`Successfully uploaded file: ${sanitizedFilename} (${file.size} bytes)`);
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
        if ((global as any).sendNotificationToUser) {
          (global as any).sendNotificationToUser(targetUserId, notification);
        }
      }

      // Return the message with sender information and attachments
      const messageWithSender = await storage.getRfiMessages(rfiId);
      const createdMessage = messageWithSender.find(m => m.id === newMessage.id);
      
      res.status(201).json(createdMessage);
    } catch (error) {
      console.error('Error sending RFI message:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to send message"
      });
    }
  });

  // Payment routes
  app.post("/api/payments/create-payment-intent", async (req, res) => {
    try {
      // Check authentication and return early if not authenticated
      if (!requireAuth(req, res)) return;
      
      const { rfpId } = req.body;
      if (!rfpId) {
        return res.status(400).json({ message: "RFP ID is required" });
      }
      
      // Verify the RFP belongs to the current user
      const rfp = await storage.getRfpById(Number(rfpId));
      if (!rfp || rfp.organizationId !== req.user?.id) {
        logAuthorizationFailure(req.user?.id, `RFP ${req.params.id}`, 'feature', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFPFeature');
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
      // Check authentication and return early if not authenticated
      if (!requireAuth(req, res)) return;
      
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
        logAuthorizationFailure(req.user?.id, `RFP ${req.params.id}`, 'feature', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFPFeature');
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

  // Download attachment endpoint with authentication
  app.get("/api/attachments/:attachmentId/download", async (req, res) => {
    try {
      requireAuth(req);
      
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
      const rfis = await storage.getRfisByEmail(req.user!.email);
      const userRfi = rfis.find(r => r.id === message.rfiId);
      
      let hasPermission = !!userRfi;
      
      // If not the submitter, check if they're the RFP owner
      if (!hasPermission) {
        const allRfps = await storage.getRfps();
        const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user!.id);
        
        for (const rfp of userRfps) {
          const rfpRfis = await storage.getRfisByRfp(rfp.id);
          if (rfpRfis.some(r => r.id === message.rfiId)) {
            hasPermission = true;
            break;
          }
        }
      }
      
      if (!hasPermission) {
        logAuthorizationFailure(req.user?.id, `Attachment ${req.params.id}`, 'access', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'AttachmentAccess');
      }
      
      // Redirect to the S3 URL (this maintains authentication context)
      res.redirect(attachment.fileUrl);
      
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'AttachmentDownload');
    }
  });

  // Delete RFI endpoint
  app.delete("/api/rfis/:id", async (req, res) => {
    try {
      requireAuth(req);

      const rfiId = validatePositiveInt(req.params.id, 'RFI ID', res);
      if (rfiId === null) return;
      
      // Get RFI details to check permissions
      const rfis = await storage.getRfisByEmail(req.user!.email);
      const userRfi = rfis.find(r => r.id === rfiId);
      
      // Check if user is the one who submitted the RFI
      let hasPermission = !!userRfi;
      
      // If not the submitter, check if they're the RFP owner
      if (!hasPermission) {
        const allRfps = await storage.getRfps();
        const userRfps = allRfps.filter(rfp => rfp.organizationId === req.user!.id);
        
        for (const rfp of userRfps) {
          const rfpRfis = await storage.getRfisByRfp(rfp.id);
          if (rfpRfis.some(r => r.id === rfiId)) {
            hasPermission = true;
            break;
          }
        }
      }

      if (!hasPermission) {
        logAuthorizationFailure(req.user?.id, `RFI ${rfiId}`, 'delete', req);
        return sendErrorResponse(res, new Error('Unauthorized'), 403, ErrorMessages.FORBIDDEN, 'RFIDeletion');
      }

      await storage.deleteRfi(rfiId);
      res.json({ message: "RFI deleted successfully" });
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.DELETE_FAILED, 'RFIDeletion');
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      requireAuth(req);
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.FETCH_FAILED, 'Notifications');
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      requireAuth(req);
      const data = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(data);
      
      // Send real-time notification if user is connected
      if ((global as any).sendNotificationToUser) {
        (global as any).sendNotificationToUser(data.userId, notification);
      }
      
      res.status(201).json(notification);
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.CREATE_FAILED, 'NotificationCreation');
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      requireAuth(req);
      
      const id = validatePositiveInt(req.params.id, 'Notification ID', res);
      if (id === null) return;
      
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.UPDATE_FAILED, 'NotificationMarkRead');
    }
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    try {
      requireAuth(req);
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.UPDATE_FAILED, 'NotificationMarkAllRead');
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      requireAuth(req);
      
      const id = validatePositiveInt(req.params.id, 'Notification ID', res);
      if (id === null) return;
      
      await storage.deleteNotification(id);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      sendErrorResponse(res, error, 500, ErrorMessages.DELETE_FAILED, 'NotificationDeletion');
    }
  });

  // For now, we'll use the payment routes from entrypoint.js
  // We'll integrate the dedicated payment router in a future update
  console.log('Payment routes are handled in entrypoint.js');

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active WebSocket connections by user ID
  const userConnections = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    // Extract session information from the request  
    const getSessionUserId = (): Promise<number | null> => {
      return new Promise((resolve) => {
        if (!req.headers.cookie) {
          resolve(null);
          return;
        }

        try {
          // SECURITY: Use proper cookie parsing
          const cookies = cookie.parse(req.headers.cookie);
          const sessionCookie = cookies['connect.sid'];
          
          if (!sessionCookie) {
            console.warn('WebSocket: No connect.sid cookie found');
            resolve(null);
            return;
          }

          // SECURITY: Properly verify signed cookie
          let sessionId: string;
          if (sessionCookie.startsWith('s:')) {
            // CRITICAL: Use exact same session secret as session.ts
            const sessionSecret = getSessionSecret();
            
            try {
              // Verify and unsign the cookie
              sessionId = cookieSignature.unsign(sessionCookie.slice(2), sessionSecret);
              if (sessionId === false) {
                console.warn('WebSocket: Invalid cookie signature');
                resolve(null);
                return;
              }
            } catch (signError) {
              console.warn('WebSocket: Cookie signature verification failed:', signError);
              resolve(null);
              return;
            }
          } else {
            sessionId = sessionCookie;
          }

          // Get session from store
          storage.sessionStore.get(sessionId as string, (err: any, session: any) => {
            if (err || !session) {
              console.warn('WebSocket session lookup failed:', err?.message || 'No session');
              resolve(null);
              return;
            }

            if (session.passport && session.passport.user) {
              const userId = parseInt(session.passport.user);
              console.log(`WebSocket session authenticated user: ${userId} (signature-verified)`);
              resolve(userId);
            } else {
              console.warn('WebSocket session has no authenticated user');
              resolve(null);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket session:', error);
          resolve(null);
        }
      });
    };
    
    // Handle user authentication and registration
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          // SECURITY: Use session user ID, ignore any client-provided userId
          const sessionUserId = await getSessionUserId();
          
          if (!sessionUserId) {
            console.warn('WebSocket auth rejected: no valid session');
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Not authenticated' }));
            ws.close(1008, 'Not authenticated'); // Policy violation code
            return;
          }
          
          if (!userConnections.has(sessionUserId)) {
            userConnections.set(sessionUserId, []);
          }
          
          userConnections.get(sessionUserId)!.push(ws);
          console.log(`User ${sessionUserId} connected via WebSocket (session-verified)`);
          
          ws.send(JSON.stringify({ type: 'auth_success', message: 'Connected successfully' }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        ws.close(1011, 'Server error');
      }
    });
    
    ws.on('close', () => {
      // Remove connection from all users when closed
      userConnections.forEach((connections, userId) => {
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
          if (connections.length === 0) {
            userConnections.delete(userId);
          }
          console.log(`User ${userId} disconnected from WebSocket`);
        }
      });
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Export function to send notifications to specific users
  (global as any).sendNotificationToUser = (userId: number, notification: any) => {
    const connections = userConnections.get(userId);
    if (connections) {
      const message = JSON.stringify({
        type: 'notification',
        data: notification
      });
      
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  };
  
  // Start the deadline monitoring service
  deadlineMonitor.start();
  
  return httpServer;
}