# Deploying to Vercel

This guide provides detailed instructions for deploying the FindConstructionBids application to Vercel.

## Prerequisites

1. A GitHub account
2. A Vercel account (you can sign up at [vercel.com](https://vercel.com) using your GitHub account)
3. A PostgreSQL database (we recommend [Neon](https://neon.tech) for serverless PostgreSQL)

## Step-by-Step Deployment Guide

### 1. Database Setup

1. Set up a PostgreSQL database with Neon or any other PostgreSQL provider
2. Make note of your database connection string
3. Ensure your database provider supports serverless connections (Neon is recommended)

### 2. Prepare Your Repository

1. Push your code to a GitHub repository
2. Ensure all critical files are in place:
   - `vercel.json` - Contains deployment configuration
   - `api/index.ts` - API routes handler
   - `index.ts` - Static content handler

### 3. Import Project in Vercel

1. Log in to your Vercel account
2. Click "Add New..." and select "Project"
3. Import your GitHub repository
4. **Important**: Vercel will automatically detect the configuration from `vercel.json`
5. If asked for build settings, you can leave them as detected from the config file

### 4. Configure Environment Variables

Add the following environment variables in the Vercel project settings:

```
DATABASE_URL=postgresql://user:password@hostname:port/database
NODE_ENV=production
SESSION_SECRET=your-secure-random-string
```

Add any other required environment variables from your `.env.example` file, such as:
- Stripe API keys (if using payments)
- Email service credentials
- Any other third-party service credentials

### 5. Deploy

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your application
3. Once deployment is complete, you can access your application at the provided URL

### 6. Verify Deployment

After deployment, verify these key areas:
1. Check that the main app loads correctly (UI and static assets)
2. Test API endpoints (e.g., `/api/health`)
3. Verify database connectivity
4. Check authentication flows

## Structure of Our Vercel Deployment

The application uses a self-contained serverless approach:

1. **Serverless Entry Point** (`entrypoint.js`):
   - Contains the entire server implementation in a single file
   - Handles database connections and authentication
   - Serves API endpoints directly
   - Acts as a static file server for the built frontend
   - Provides fallback for SPA client-side routing
   
2. **API Gateway** (`api/index.ts`):
   - Simply imports and re-exports the main entrypoint.js application
   - Provides the routing entry point for the Vercel serverless environment

This self-contained approach eliminates module resolution issues in Vercel's serverless environment and ensures reliable deployment.

## Troubleshooting Common Issues

### 404 Errors on Page Load

If you encounter 404 errors when accessing the application:

1. Check the Function Logs in the Vercel dashboard
2. Verify that both handlers (API and static) are deployed correctly
3. Ensure the routes in `vercel.json` are correctly configured
4. Check that the build process completed successfully

### Module Resolution Errors in Vercel

When deploying to Vercel, you might encounter one of these errors:

#### 1. ERR_UNSUPPORTED_DIR_IMPORT Error

```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/var/task/server/routes' is not supported resolving ES modules imported from /var/task/api/index.js
```

This happens because Node.js ES modules don't support directory imports.

#### 2. ERR_MODULE_NOT_FOUND Error

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/server/routes/index' imported from /var/task/api/index.js
```

This happens because Vercel's Node.js environment has trouble finding certain modules in serverless environments.

#### 3. ERR_UNKNOWN_FILE_EXTENSION Error

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for /var/task/server/routes.ts
```

This happens when you try to import TypeScript files directly in a production environment where only compiled JavaScript is available.

### Solution: Our Self-Contained Approach

After experiencing various module resolution issues in Vercel's serverless environment, we've adopted a more reliable approach:

#### Self-Contained Entrypoint

We've created a completely self-contained `entrypoint.js` file that:

1. Defines all necessary schema directly in the file
2. Implements all authentication logic inline
3. Contains all required API routes
4. Handles static file serving
5. Avoids all imports of TypeScript files

```javascript
// Example of our self-contained approach
import express from 'express';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Define schema inline
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  // other fields...
});

// Define functions inline
async function comparePasswords(supplied, stored) {
  // Implementation...
}

// Initialize Express app with direct route definitions
const app = express();
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', serverStartTime: Date.now() });
});

// Additional routes...

export default app;
```

#### API Gateway Pattern

The `api/index.ts` file simply imports and re-exports the entrypoint app:

```typescript
// api/index.ts
import app from '../entrypoint';
export default app;
```

This approach completely eliminates module resolution issues while retaining all functionality.

#### Alternative Approaches

If you prefer not to use the self-contained approach, you can try these other methods:

1. **Bundle File Approach**: Create a bundle file that explicitly imports and re-exports all needed components.

```javascript
// Example bundle file
import healthRouter from './routes/health';
import paymentsRouter from './routes/payments';

export function registerAllRoutes(app) {
  app.use('/api/health', healthRouter);
  app.use('/api/payments', paymentsRouter);
  return app;
}
```

2. **Clean Imports Without Extensions**: Use imports without file extensions.

```typescript
// Correct approach - no extension
import { registerRoutes } from '../server/routes';
```

3. **Configuration Setup**: Make sure your vercel.json includes all necessary files:

```json
"includeFiles": ["server/**/*", "shared/**/*"]
```

4. **Index Files for Directories**: Create index.ts files in directories to export combined functionality.

### Database Connection Issues

If you encounter database connectivity problems:

1. Verify your `DATABASE_URL` environment variable
2. Check if the serverless connection is configured correctly
3. Ensure your database provider allows connections from Vercel's IP ranges
4. Increase the function timeout if you experience cold start issues

### Building Issues

If the build process fails:

1. Check the build logs for specific error messages
2. Ensure all dependencies are correctly listed in package.json
3. Verify that your build command (`npm run build`) works locally
4. Consider using a newer Node.js version in Vercel settings

## Performance Optimization

For optimal performance on Vercel:

1. Keep serverless functions small and focused
2. Minimize cold start times by reducing dependencies
3. Utilize edge caching for static assets
4. Consider using Vercel's Edge Functions for latency-sensitive operations

## Monitoring and Logging

Vercel provides built-in monitoring and logging:

1. Use the Vercel dashboard to view function logs
2. Set up alerts for deployment failures
3. Monitor function execution times
4. Consider integrating additional monitoring tools like Sentry