// This file bundles all routes in a way that avoids directory imports in serverless environments
// Import all route modules directly
import healthRouter from './routes/health.js';
import paymentsRouter from './routes/payments.js';
import rfpRouter from './routes/rfp.js';

// Export them as a bundle
export const routes = {
  health: healthRouter,
  payments: paymentsRouter,
  rfp: rfpRouter
};

// Helper function to register all routes to an Express app
export function registerAllRoutes(app) {
  app.use('/api/health', healthRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/rfp', rfpRouter);
  
  return app;
}