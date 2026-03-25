# FindConstructionBids Platform

## Overview
FindConstructionBids is a platform connecting government organizations with contractors for streamlined construction bid management. It features an intelligent RFP/RFI system, real-time analytics, and secure document management, aiming to modernize and simplify the bidding process for both parties.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite)
- **UI**: Radix UI with Tailwind CSS
- **State Management**: TanStack Query (server state), React hooks (local state)
- **Routing**: Wouter
- **Authentication**: Context-based, session management
- **Internationalization**: Multi-language support

### Backend
- **Runtime**: Node.js with Express.js (TypeScript, ES Modules)
- **API**: RESTful, organized endpoints
- **Session Management**: Express sessions (configurable for PostgreSQL)
- **Authentication**: Passport.js (local strategy, bcrypt)
- **File Handling**: Multer for multipart forms, integrates with Cloudinary and AWS S3

### Database
- **Primary**: PostgreSQL with Drizzle ORM
- **Connection Pooling**: Neon serverless driver
- **Schema Management**: Type-safe definitions, Drizzle-Kit for migrations

### Core Features
- **Data Models**: Users (contractors/government), RFPs (with status, deadlines, certification), RFIs, Analytics, Employees.
- **Admin Panel**: Separate `/admin` dashboard for platform management (user, payment, RFP management, AI-powered RFP import).
- **RFP Import (AI-powered)**: Multi-step process to upload JSON RFPs, analyze (duplicate check, CSI to MasterFormat mapping), enrich data via DeepSeek API (city, street, zip, budget, certifications), and manage drafts.
- **Authentication**: Email/password, session-based, email verification, password reset, role-based access control.
- **Payment Integration**: Stripe for RFP featuring services ($25.00), supporting intent creation and verification.
- **File Management**:
    - **AWS S3**: Primary storage for user uploads (images, documents, attachments) up to 350MB using presigned URLs to bypass serverless function size limits. User-specific folder structure (`users/{userId}/...`). Supports public read access via bucket policy or private access with presigned URLs for downloads.
    - **Cloudinary**: Legacy support.
- **SEO-Friendly URLs**: RFPs use `/rfp/:state/:clientName/:slug` format with auto-generated slugs and redirects for legacy URLs.
- **New & Featured Opportunities**: Displays new RFPs sorted by creation date, with "New" badges for recent entries. Provides CTA for empty featured opportunities.

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL
- **Vercel**: Deployment platform
- **Replit**: Development environment

### Third-party Services
- **AWS S3**: File storage
- **Stripe**: Payment processing
- **Cloudinary**: Legacy file storage
- **Mailjet/SendGrid**: Email delivery
- **DeepSeek API**: AI enrichment for RFP data

### Development Tools
- **Drizzle Kit**: Database migrations
- **ESBuild**: JavaScript bundling
- **Vitest**: Testing framework
- **MSW**: API mocking