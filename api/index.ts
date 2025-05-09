// This file is specifically for Vercel serverless deployments
// It simply re-exports our entrypoint.js application
// This avoids maintaining two separate implementations

// Import the app from our entrypoint.js file
// Vercel will handle the module resolution
import app from '../entrypoint';

// Export the app for Vercel serverless functions
export default app;