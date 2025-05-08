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

### 2. Prepare Your Repository

1. Push your code to a GitHub repository
2. Make sure all changes in this project are committed

### 3. Import Project in Vercel

1. Log in to your Vercel account
2. Click "Add New..." and select "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Select "Other"
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Development Command: `npm run dev`

### 4. Configure Environment Variables

Add the following environment variables in the Vercel project settings:

```
DATABASE_URL=postgresql://user:password@hostname:port/database
NODE_ENV=production
```

Add any other required environment variables from your `.env.example` file.

### 5. Deploy

1. Click "Deploy" to start the deployment process
2. Vercel will build and deploy your application
3. Once deployment is complete, you can access your application at the provided URL

## Troubleshooting Vercel Deployment

If you encounter issues during deployment, check the following:

1. **Database Connection Issues**:
   - Ensure your DATABASE_URL is correct
   - Check if the database allows connections from Vercel's IP ranges
   - Verify that the database user has appropriate permissions

2. **Build Errors**:
   - Check the build logs in Vercel for specific error messages
   - Ensure all dependencies are correctly listed in package.json

3. **Runtime Errors**:
   - Check the function logs in Vercel for runtime errors
   - You may need to adjust the serverless function timeout if your application requires more time to initialize

## Important Notes

1. **Serverless Limitations**: 
   - Vercel functions have execution time limits (typically 10-60 seconds)
   - Connections to databases may experience cold starts
   - Background jobs won't persist indefinitely

2. **Database Performance**:
   - Use connection pooling if available
   - Consider using Neon's serverless driver for better performance

3. **Environment Variables**:
   - All sensitive information should be stored as environment variables
   - Never commit sensitive values to your repository

## Monitoring and Logging

Vercel provides built-in monitoring and logging. You can view logs by:

1. Going to your project in the Vercel dashboard
2. Clicking on a deployment
3. Navigating to "Functions" and selecting a function to view its logs