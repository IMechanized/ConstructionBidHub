// This file is specifically for Vercel serverless deployments
// It serves as the API route entry point and also handles static file serving

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from '../server/routes';

// Get dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all API routes
registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error(`[Error] ${status} - ${message}`);
  res.status(status).json({ message });
});

// Determine the static files directory - optimized for Vercel's file structure
const findStaticDir = () => {
  const possiblePaths = [
    path.join(__dirname, '../dist/public'),
    path.join(__dirname, '../public'),
    path.join(process.cwd(), 'dist/public'),
    path.join(process.cwd(), 'public')
  ];

  for (const dir of possiblePaths) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
      console.log(`Using static directory: ${dir}`);
      return dir;
    }
  }

  // Fall back to a reasonable default if nothing is found
  console.warn('No valid static directory found, using default');
  return path.join(process.cwd(), 'dist/public');
};

// Serve static files if they exist
const staticDir = findStaticDir();
app.use(express.static(staticDir));

// For all other routes, serve the index.html file
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

export default app;