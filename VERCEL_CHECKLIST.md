# Vercel Deployment Checklist

## Fixed Issues
- ✅ Fixed critical import error in entrypoint.js
  - The `eq` operator is now correctly imported from 'drizzle-orm' instead of 'drizzle-orm/neon-serverless'
- ✅ Fixed ES Module issues in entrypoint.js
  - Changed CommonJS `require()` to ES Module imports
  - Moved all imports to the top of the file
- ✅ Fixed database schema errors in entrypoint.js
  - Removed references to non-existent columns like "role"
  - Updated schema definitions to match exactly with shared/schema.ts
  - Synchronized field definitions between entrypoint.js and schema.ts
- ✅ Added missing API endpoints to entrypoint.js
  - Added RFP details endpoint (/api/rfps/:id).
  - Added RFI endpoints (/api/rfps/:id/rfi, /api/rfis).
  - Added analytics endpoints (/api/analytics/rfp/:id, /api/analytics/boosted)
  - Implemented additional database schemas and storage methods.
- ✅ Fixed session store implementation.
  - Fixed "ReferenceError: SessionStore is not defined" error.
  - Implemented memory-based session store instead of PostgreSQL store
  - Resolved session store inconsistency by removing duplicate implementation.
  - Used imported createMemoryStore function properly.
- ✅ Fixed RFIs schema and database errors
  - Updated RFIs schema to match actual database structure.
  - Preserved original authentication behavior on all routes
  - Maintained consistent error handling across API endpoints.

## Required Environment Variables
Before deploying to Vercel, make sure to set these environment variables in the Vercel project settings:

### Critical Variables
- [ ] DATABASE_URL - PostgreSQL connection string
- [ ] SESSION_SECRET - Random string for session encryption
- [ ] NODE_ENV - Should be set to "production"

### Feature-Dependent Variables
- [ ] STRIPE_SECRET_KEY - Required for payment processing
- [ ] STRIPE_WEBHOOK_SECRET - Required for Stripe webhooks
- [ ] MAILJET_API_KEY - Required for email functionality
- [ ] MAILJET_API_SECRET - Required for email functionality
- [ ] CLOUDINARY_CLOUD_NAME - Required for file uploads
- [ ] CLOUDINARY_API_KEY - Required for file uploads
- [ ] CLOUDINARY_API_SECRET - Required for file uploads

## Deployment Process

### Option 1: Direct Deployment (Using Simplified Schema)
1. Push the fixed code to your GitHub repository
2. Create a new project on Vercel and import your GitHub repository
3. Set all the required environment variables
4. Deploy the project

### Option 2: With Database Migration (Recommended)
1. Push the fixed code to your GitHub repository
2. Set up your PostgreSQL database (Neon is recommended for Vercel)
3. Run the database migration locally against your production database:
   ```bash
   # Set DATABASE_URL to your production database
   export DATABASE_URL=postgresql://user:password@hostname:port/database
   
   # Push schema changes
   npm run db:push
   ```
4. Create a new project on Vercel and import your GitHub repository
5. Set all the required environment variables
6. Deploy the project

## Post-Deployment Verification
1. Check that the application loads properly
2. Verify API routes are working (test /api/health endpoint)
3. Test authentication flows
4. Test file uploads (if implemented)
5. Test payment processing (if implemented)

## Troubleshooting Common Issues

### 404 Errors
- Check the Vercel dashboard logs and verify the static build output
- Ensure the routes in `vercel.json` are correctly configured

### Module Resolution Errors
- Make sure all imports are correctly structured (avoid TypeScript file extensions)
- Check that imports only use ES Module syntax (no CommonJS require)

### Database Errors
- Verify your DATABASE_URL and ensure your database allows connections from Vercel's IP ranges
- If you see "column does not exist" errors, you need to run the schema migration (Option 2 above)
- For critical database issues, you can use direct SQL to check the actual schema:
  ```sql
  -- List all columns in a table to verify schema
  SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
  ```
- Remember to use a database that supports serverless connections (Neon is recommended)

## Performance Optimizations
- Consider setting up edge caching for static assets
- Use serverless-optimized database connection settings
- Keep dependencies minimal to reduce cold start times