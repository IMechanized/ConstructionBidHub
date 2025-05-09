// Export all routes from this directory
import healthRoutes from './health';
import paymentsRoutes from './payments';
import rfpRoutes from './rfp';

export {
  healthRoutes,
  paymentsRoutes,
  rfpRoutes
};

// Re-export the main routes file
export { registerRoutes } from '../routes';