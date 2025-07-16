# Dark Street Tech - AI-Powered SaaS Platform

## Overview

Dark Street Tech is a full-stack AI-powered SaaS platform that provides document analysis and performance analytics services. The application features a modern React frontend with a dark cyberpunk aesthetic and a robust Node.js/Express backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preference: Mature, professional look inspired by Palantir.com instead of quirky/neon design.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Styling**: Professional dark theme with sophisticated blue color palette and enterprise-focused design

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **File Processing**: Multer for file uploads with in-memory storage

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon serverless connection pool with WebSocket support

## Key Components

### Authentication System
- **Provider**: Replit Auth integration with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user creation and profile management
- **Security**: HTTP-only cookies, secure session handling

### Document Processing Service
- **File Upload**: Multer with 10MB file size limit
- **Text Extraction**: Simulated OCR and text extraction from various file types
- **AI Analysis**: Mock AI services for document analysis, sentiment analysis, and quality scoring
- **Performance Tracking**: Processing time metrics storage

### Subscription Management
- **Payment Processing**: Razorpay integration for subscription payments
- **Plan Management**: Flexible subscription plans with feature-based access control
- **Trial System**: 30-day free trial for new users
- **Status Tracking**: Real-time subscription status monitoring

### Performance Analytics
- **Metrics Collection**: Document processing times, accuracy scores, and usage statistics
- **Dashboard**: Real-time charts and visualizations using Recharts
- **Trend Analysis**: Historical performance tracking and analytics generation
- **Report Generation**: Automated analytics report creation

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Document Upload**: Files uploaded through React frontend to Express backend
3. **Document Processing**: Backend processes documents and stores results in database
4. **Analytics Generation**: Performance metrics collected and aggregated for dashboard display
5. **Subscription Management**: Payment processing through Razorpay with status updates

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection management
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **passport**: Authentication middleware
- **razorpay**: Payment processing
- **multer**: File upload handling

### UI Components
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **recharts**: Chart and visualization library

### Development Tools
- **vite**: Frontend build tool and development server
- **typescript**: Type safety across the application
- **drizzle-kit**: Database schema management
- **esbuild**: Production backend bundling

## Deployment Strategy

### Development
- **Frontend**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution with auto-reload
- **Database**: Drizzle push for schema synchronization

### Production
- **Frontend**: Static build served by Express
- **Backend**: Bundled with esbuild for optimal performance
- **Database**: Automated migrations through Drizzle Kit
- **Environment**: Configured for Replit deployment with proper asset handling

### Security Considerations
- HTTPS enforcement for authentication
- Secure session configuration
- Input validation and sanitization
- File upload restrictions and security
- Environment variable protection

The application follows a modern full-stack architecture with emphasis on type safety, performance, and user experience while maintaining scalability for growth.

## Recent Changes

**Phase 1 Complete - Static Marketing Website (July 16, 2025)**
- Built complete static marketing website using exact content from provided documents
- Created 5 pages with authentic Dark Street Tech messaging:
  * Home page with company overview and product introductions
  * Fetch Patterns page with complete product description
  * PerMeaTe Enterprise page with detailed functionality explanation
  * Next page showcasing upcoming products (Enterprise Mind, QOAN, PCI Index)
  * About page with leadership information and company background
- Implemented VS Code-inspired UI with geometric line separators between sections
- Enhanced responsive text scaling (.text-responsive-xl/lg/md/sm) for all screen sizes
- Fixed logo alignment (h-10) to match Sign In button height
- Standardized all container padding to py-6 across all pages for consistent spacing
- Maintained authentic content structure and messaging throughout
- Ready for Phase 2: Building separate SaaS applications

**Previous Design System Implementation (July 16, 2025)**
- Integrated Roboto Light font (weight 300) for body text
- Created comprehensive loading system with Dark Street Tech branding
- Implemented eye-peeking animation for logo icon
- Built VS Code-inspired minimal design with geometric divisions
- Added section dividers and clean card layouts
- Removed authentication from public marketing pages