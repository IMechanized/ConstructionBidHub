# FindConstructionBids Platform

## Overview

FindConstructionBids is a comprehensive construction bid management platform that connects government organizations with qualified contractors through an intelligent RFP/RFI system. The platform provides streamlined bidding processes, real-time analytics, and secure document management.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI components with custom styling using Tailwind CSS
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for client-side routing
- **Authentication**: Context-based authentication with session management
- **Internationalization**: Support for multiple languages with dedicated language selection

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES Modules
- **API Design**: RESTful API endpoints with structured route organization
- **Session Management**: Express sessions with memory store (configurable for PostgreSQL)
- **Authentication**: Passport.js with local strategy and bcrypt password hashing
- **File Handling**: Multer for multipart form data with Cloudinary integration

### Database Architecture
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Connection Pooling**: Neon serverless PostgreSQL driver with optimized connection settings
- **Schema Management**: Type-safe schema definitions with Drizzle-Kit for migrations

## Key Components

### Core Data Models
1. **Users**: Organization profiles supporting both contractors and government entities
2. **RFPs**: Request for Proposals with deadline tracking and certification requirements
3. **RFIs**: Request for Information system for project clarifications
4. **Analytics**: View tracking and engagement metrics for performance monitoring
5. **Employees**: Team member management for organization accounts

### Authentication System
- Email/password authentication with secure password hashing
- Session-based authentication with configurable storage
- Email verification and password reset functionality
- Role-based access control and onboarding workflows

### Payment Integration
- Stripe payment processing for RFP featuring services
- Payment intent creation and verification workflows
- Configurable pricing ($25.00 for featured listings)
- Support for both test and production Stripe environments

### File Management
- **AWS S3 Integration**: Primary storage for all user uploads with user-specific folder organization
  - Direct client-to-S3 uploads via presigned URLs (Vercel-compatible)
  - Supports files up to 350MB per upload (bypasses Vercel's 4.5MB serverless limit)
  - User-specific folder structure: `users/{userId}/images/`, `users/{userId}/documents/`, `users/{userId}/attachments/`
  - Two-step upload process: backend generates presigned URL, client uploads directly to S3
  - **S3 Bucket Configuration**: Modern S3 buckets with ACLs disabled use a hybrid access approach
    - **Upload**: Presigned URLs without ACL parameters (compatible with ACL-disabled buckets)
    - **Download**: Automatically uses presigned URLs when AWS credentials are available, falls back to direct access
    - **Recommended Setup**: Add a bucket policy for public read access to enable direct file access:
      ```json
      {
        "Version": "2012-10-17",
        "Statement": [{
          "Sid": "PublicReadGetObject",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }]
      }
      ```
    - **Private Files**: If bucket policy is not set, download endpoints will automatically generate presigned URLs
    - Supports multiple URL formats: virtual-hosted, path-style, and CloudFront distributions
- **Legacy Cloudinary support**: Available for backward compatibility
- Secure file handling with type validation and authentication requirements
- PDF generation capabilities for reports and documents

#### Presigned Upload Architecture
The platform uses a presigned URL approach for file uploads to support large construction documents (up to 350MB) while remaining compatible with Vercel's serverless architecture:

1. **Client requests presigned URL**: Frontend calls `/api/upload-document/presigned-url` with filename and MIME type
2. **Backend generates signed URL**: Server validates auth, file type, and generates S3 presigned URL with user-specific path
3. **Direct S3 upload**: Client uploads file directly to S3 using presigned URL (bypasses Vercel entirely)
4. **File URL returned**: Backend returns the public S3 URL for database storage

This approach ensures large files never transit through Vercel's serverless functions, avoiding the 4.5MB body size limit.

## Data Flow

### User Registration & Onboarding
1. User creates account with basic information
2. Email verification process initiated
3. Onboarding form completion for company details
4. Account activation and dashboard access

### RFP Management Workflow
1. Government organizations create RFPs with detailed requirements
2. Optional RFP featuring through Stripe payment processing
3. Contractors browse and filter available opportunities
4. RFI submission and management for project clarifications
5. Analytics tracking for view counts and engagement metrics

### Real-time Features
- Hot module replacement in development
- WebSocket support for live updates
- Automatic session management and authentication persistence

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Vercel**: Primary deployment platform with serverless functions
- **Replit**: Alternative development and deployment environment

### Third-party Services
- **AWS S3**: Primary file storage and media management with presigned URL uploads
- **Stripe**: Payment processing for premium features
- **Cloudinary**: Legacy file upload support (deprecated in favor of S3)
- **Mailjet/SendGrid**: Email delivery services
- **WebSocket**: Real-time communication support

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Fast JavaScript bundling for production
- **Vitest**: Testing framework with React Testing Library
- **MSW**: API mocking for testing environments

## Deployment Strategy

### Production Deployment (Vercel)
- Serverless function architecture using `entrypoint.js` as the main API handler
- Static site generation for the React frontend
- Environment-specific database connections with connection pooling optimization
- Cloud Run deployment option available through Vercel configuration

### Development Environment
- Local development with hot reloading via Vite
- PostgreSQL database with Drizzle ORM development workflow
- Environment variable management with `.env` files
- Automated testing with Vitest and React Testing Library

### Database Management
- Schema versioning through Drizzle migrations
- Backup scheduling with automated cleanup (7-day retention)
- Connection pooling optimized for serverless environments
- Support for both development and production database instances

## Changelog

Changelog:
- November 28, 2025 (evening): Fixed critical S3, CSP, and Service Worker issues with hybrid access model
  - **Service Worker Fix**: Updated service worker (v1.2.0) to not intercept third-party resources (Stripe, Google Maps, AWS S3)
  - **S3 Configuration**: Removed ACL parameters from uploads; created S3_SETUP_GUIDE.md with required CORS and bucket policy configuration
  - **Download Strategy**: Implemented intelligent hybrid download strategy with presigned URLs and public fallback
  - **URL Compatibility**: Enhanced S3 key extraction to support virtual-hosted, path-style, and CloudFront URL formats
  - **CSP Updates**: Updated Content Security Policy headers to allow Stripe.js, Google Maps, and Google Fonts resources
  - **Payment Router**: Mounted payments router to fix `/api/payments/price` endpoint
  - **TypeScript Fixes**: Resolved all compilation errors (cookie-signature types, parameter validation)
  - **Documentation**: Added comprehensive S3 bucket configuration guide and replit.md updates
- November 28, 2025: Implemented presigned URL upload system for S3 with user-specific folder organization
  - Added support for files up to 350MB (Vercel-compatible architecture)
  - Direct client-to-S3 uploads bypass Vercel's 4.5MB serverless limit
  - User-specific folder structure prevents naming conflicts
  - Three presigned URL endpoints: /api/upload/presigned-url (images), /api/upload-document/presigned-url (documents), /api/upload-attachment/presigned-url (attachments)
- June 18, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.