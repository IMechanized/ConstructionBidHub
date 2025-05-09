// This file is specifically for Vercel serverless deployments
// It serves as the API route entry point to handle API requests

import express, { type Request, Response, NextFunction } from 'express';
// Import directly from the main routes file to avoid module resolution issues
import { registerRoutes } from '../server/routes.ts';
import { setupAuth } from '../server/auth.ts';
import session from 'express-session';
import { storage } from '../server/storage.ts';
import crypto from 'crypto';

// Create Express app instance
const app = express();

// Apply basic middleware
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
setupAuth(app);

// Logger middleware for API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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

// Register API routes
registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${status} - ${message}`);
  res.status(status).json({ message });
});

// Export handler for Vercel serverless
export default app;