# FindConstructionBids Developer Guide

## Project Overview
FindConstructionBids is a NextJS-powered construction bid management platform that connects government organizations with qualified contractors for RFP and RFI opportunities.

## Project Structure
```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   └── pages/         # Page components and routing
├── server/                 # Backend Express server
│   ├── storage.ts         # Database operations and business logic
│   ├── routes.ts          # API endpoint definitions
│   └── auth.ts            # Authentication middleware
└── shared/                # Shared types and schemas
    └── schema.ts          # Database schema and type definitions
```

## Key Components

### Database Models
The application uses PostgreSQL with Drizzle ORM. Key models include:

1. Users
   - Organization profiles (both contractors and government entities)
   - Authentication credentials
   - Company information and certifications

2. RFPs (Request for Proposals)
   - Core bid opportunity information
   - Deadlines and important dates
   - Budget and certification requirements

3. RFIs (Request for Information)
   - Questions and clarifications
   - Linked to specific RFPs
   - Communication tracking

4. Analytics
   - View tracking
   - Engagement metrics
   - Performance statistics

### Authentication Flow
1. User registration
   - Email/password signup
   - Company information collection
   - Optional minority-owned business verification

2. Session Management
   - Express session with PostgreSQL store
   - Secure cookie-based authentication
   - Role-based access control

## Development Setup

### Prerequisites
- Node.js 20.x
- PostgreSQL database
- Cloudinary account (for file uploads)

### Environment Variables
```env
DATABASE_URL=           # PostgreSQL connection string
SESSION_SECRET=        # Random string for session encryption
CLOUDINARY_URL=        # Cloudinary configuration URL
CLOUDINARY_CLOUD_NAME= # Cloudinary cloud name
CLOUDINARY_API_KEY=    # Cloudinary API key
CLOUDINARY_API_SECRET= # Cloudinary API secret
```

### Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Database migrations:
   ```bash
   npm run db:push  # Push schema changes to database
   ```

## Key Features and Uses

### RFP Management
- Creation and editing of RFPs
- File attachments via Cloudinary
- Deadline tracking
- Analytics and engagement tracking

### Contractor Features
- RFP discovery and filtering
- RFI submission
- Profile and certification management
- Bid tracking

### Analytics Dashboard
- View tracking
- Engagement metrics
- Performance statistics
- Export capabilities

## Code Style Guide

### TypeScript
- Use TypeScript for all new code
- Define interfaces for all data structures
- Use enums for fixed sets of values

### React Components
- Use functional components with hooks
- Keep components focused and small
- Use composition over inheritance
- Implement proper error boundaries

### Database Operations
- Use Drizzle ORM for all database operations
- Define types using `drizzle-zod`
- Implement proper error handling
- Use transactions where appropriate

### API Routes
- RESTful endpoint design
- Proper validation using Zod schemas
- Consistent error response format
- Proper HTTP status codes

## Testing
Currently, the application relies on manual testing. Future improvements should include:
- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for critical user flows

## Deployment
The application is deployed on Replit and uses:
- Replit's PostgreSQL database
- Built-in CI/CD
- Automatic HTTPS
- Zero-config deployment

## Common Issues and Solutions
1. Database connection issues
   - Check DATABASE_URL environment variable
   - Verify database permissions
   - Check connection pool settings

2. File upload issues
   - Verify Cloudinary credentials
   - Check file size limits
   - Verify supported file types

3. Performance issues
   - Use query optimization
   - Implement proper indexing
   - Cache frequently accessed data

## Contributing Guidelines
1. Follow the existing code style
2. Add comments for complex logic
3. Update documentation for significant changes
4. Test thoroughly before submitting changes
