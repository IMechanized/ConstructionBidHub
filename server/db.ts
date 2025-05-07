import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon serverless driver
neonConfig.webSocketConstructor = ws;

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

// Create connection pool with optimized settings
export const pool = new Pool({ 
  connectionString: getDatabaseUrl(),
  max: 10, // Reduce max connections for faster startup
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 5000, // 5 seconds connection timeout
});

// Initialize Drizzle ORM
export const db = drizzle({ client: pool, schema });

// Export pool for cleanup
export { pool as dbPool };