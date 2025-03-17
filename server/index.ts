import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log, setupVite, serveStatic } from "./vite";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { startBackupScheduler } from "./lib/backup-scheduler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Disable HMR overlay through environment variable
process.env.VITE_DISABLE_HMR_OVERLAY = "true";

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

      log(logLine);
    }
  });

  next();
});

const startServer = async (): Promise<void> => {
  try {
    const PORT = 5000;
    const HOST = "0.0.0.0";

    log(`Starting server setup on port ${PORT}...`);

    // Register routes and get HTTP server instance
    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`[Error] ${status} - ${message}`);
      res.status(status).json({ message });
    });

    // Setup static file serving or Vite middleware based on environment
    if (process.env.NODE_ENV === "production") {
      log('Setting up static file serving...');
      serveStatic(app);
    } else {
      log('Setting up Vite middleware...');
      await setupVite(app, server);
    }

    // Start backup scheduler
    try {
      startBackupScheduler();
      log('Automated backup scheduler started successfully');
    } catch (error) {
      console.error('Failed to start backup scheduler:', error);
      // Continue server startup even if backup scheduler fails
    }

    // Check if port is in use before attempting to listen
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free up the port and try again.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Start listening
    await new Promise<void>((resolve, reject) => {
      server.listen(PORT, HOST, () => {
        log(`Server started successfully on http://${HOST}:${PORT}`);
        resolve();
      }).on('error', (err) => {
        reject(err);
      });
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start server with proper error handling
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error("Critical server error:", error);
    process.exit(1);
  }
})();