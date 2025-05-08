# FindConstructionBids Platform

A robust construction bid management platform designed for seamless project collaboration and efficiency, with enhanced internationalization and analytics capabilities.

## Features

- NextJS frontend with responsive design and PWA support
- Comprehensive analytics tracking system
- PostgreSQL database with Redis caching
- Secure role-based authentication
- Advanced RFP and RFI management with detailed view tracking
- Internationalization with dedicated language selection
- Automatic hot-reload development environment

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables by copying `.env.example` to `.env` and filling in the values
4. Start the development server:
   ```
   npm run dev
   ```

## Database Management

This project uses Drizzle ORM with PostgreSQL. To push schema changes to the database:

```
npm run db:push
```

## Deployment Options

### Replit Deployment

1. Fork this project on Replit
2. Set up required environment variables
3. Deploy using Replit's deployment feature

### Vercel Deployment

1. Fork this repository to your GitHub account
2. Create a new project on Vercel and import the GitHub repository
3. Set up the following environment variables on Vercel:
   - `DATABASE_URL` - Your PostgreSQL database URL (we recommend using Neon for serverless PostgreSQL)
   - Other required environment variables as outlined in `.env.example`
4. Deploy the project

When deploying to Vercel, the application uses serverless-optimized configurations:
- The database connection pool is configured for serverless environments
- Background jobs are disabled in serverless mode
- The application exports the Express app as the default export for compatibility

## Environment Variables

See `.env.example` for a list of required environment variables.

## License

MIT