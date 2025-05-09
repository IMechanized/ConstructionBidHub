// This is the main entry point for the Vercel deployment
// It serves static files and handles server-side rendering

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Import server-side handlers for API fallback
import apiHandler from './api/index';

// Set up ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Determine the static files directory - optimized for Vercel's file structure
const findStaticDir = () => {
  const possiblePaths = [
    path.join(__dirname, 'dist/public'),
    path.join(__dirname, 'public'),
    path.join(process.cwd(), 'dist/public'),
    path.join(process.cwd(), 'public')
  ];

  for (const dir of possiblePaths) {
    if (fs.existsSync(dir)) {
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

// For all other routes, serve the index.html file (SPA fallback)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    // API routes should be handled by the API serverless function
    return res.status(404).send('API endpoint not found');
  }
  
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not found. Make sure to build the app first.');
  }
});

// Start the server if not in a serverless environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Static server running on port ${PORT}`);
  });
}

export default app;