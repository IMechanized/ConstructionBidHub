import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";

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

const startServer = async (port: number): Promise<void> => {
  try {
    log(`Attempting to start server on port ${port}...`);
    const server = registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`[Error] ${status} - ${message}`);
      res.status(status).json({ message });
    });

    log("Setting up environment...");
    if (app.get("env") === "development") {
      log("Development mode: Setting up Vite...");
      await setupVite(app, server);
    } else {
      log("Production mode: Setting up static serving...");
      serveStatic(app);
    }

    return new Promise((resolve, reject) => {
      const HOST = "0.0.0.0";

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${port} is in use, trying next port...`);
          server.close();
          resolve(startServer(port + 1));
        } else {
          console.error('Server error:', error);
          reject(error);
        }
      });

      server.listen(port, HOST, () => {
        log(`Server started successfully on http://${HOST}:${port}`);
        resolve();
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    throw error;
  }
};

(async () => {
  try {
    const initialPort = parseInt(process.env.PORT || '5000', 10);
    await startServer(initialPort);
  } catch (error) {
    console.error("Critical server error:", error);
    process.exit(1);
  }
})();