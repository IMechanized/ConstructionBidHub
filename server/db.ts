import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.js";

// Configure WebSocket for Neon serverless driver
if (ws) {
  neonConfig.webSocketConstructor = ws;
}

// Get environment-specific database URL
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'test') {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error("TEST_DATABASE_URL must be set for test environment");
    }
    return process.env.TEST_DATABASE_URL;
  }
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for production environment");
  }
  return process.env.DATABASE_URL;
};

// Different pool settings for serverless vs traditional deployment
const isServerlessEnv = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Create connection pool with environment-specific optimized settings
export const pool = new Pool({ 
  connectionString: getDatabaseUrl(),
  // Serverless environments need fewer connections with shorter timeouts
  max: isServerlessEnv ? 1 : 10,
  idleTimeoutMillis: isServerlessEnv ? 10000 : 30000, // shorter idle timeout in serverless
  connectionTimeoutMillis: 5000, // 5 seconds connection timeout
});

// Initialize Drizzle ORM
export const db = drizzle({ client: pool, schema });

// Export pool for cleanup
export { pool as dbPool };