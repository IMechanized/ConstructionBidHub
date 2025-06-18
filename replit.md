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
- Cloudinary integration for document and image uploads
- Secure file handling with size limits (5MB)
- PDF generation capabilities for reports and documents

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
- **Stripe**: Payment processing for premium features
- **Cloudinary**: File upload and media management
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
- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.