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

The application uses a dual-handler approach:

1. **API Handler** (`api/index.ts`):
   - Handles all API routes (`/api/*`)
   - Manages database connections
   - Handles authentication and sessions

2. **Static Content Handler** (`index.ts`):
   - Serves the built frontend application
   - Handles client-side routing
   - Falls back to serving index.html for SPA routing

This separation ensures optimal performance in the serverless environment.

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

### Solution

The correct approach is to use clean imports without file extensions:

```typescript
// Correct approach - no extension
import { registerRoutes } from '../server/routes';
```

Do NOT use explicit file extensions:

```typescript
// INCORRECT - will fail in production
import { registerRoutes } from '../server/routes.ts';
```

For directory imports, you need to create an `index.ts` file in that directory that exports the necessary functions. Then import from the directory directly.

Also make sure your vercel.json is configured to include all files needed:

```json
"includeFiles": ["server/**/*", "shared/**/*"]
```

For the specific ERR_UNSUPPORTED_DIR_IMPORT error, make sure each directory you import from has an index.ts file that re-exports the necessary components.

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