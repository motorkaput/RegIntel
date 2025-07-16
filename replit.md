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

**Loading Indicators Implementation (July 16, 2025)**
- Created comprehensive animated loading system with Dark Street Tech branding
- Added 5 loading components: LoadingSpinner, LoadingSkeleton, LoadingButton, LoadingOverlay, LoadingScreen
- Implemented eye-peeking animation for Dark Street Tech icon (rotateY left/right)
- Built interactive demo page at /loading-demo showcasing all variants
- Integrated Roboto Light font across all loading states
- Fixed authentication issues on public pages (Fetch Patterns now accessible without login)
- Adjusted logo height to match Sign In button height
- Added VS Code-inspired animations with geometric styling

**Font and Logo Updates (July 16, 2025)**
- Integrated Roboto Light font (weight 300) for body text
- Updated navbar and footer to use Dark Street Tech logo assets
- Matched logo height to Sign In button for visual consistency
- Maintained professional minimal aesthetic with improved typography

**VS Code-Inspired Minimal Design (July 16, 2025)**
- Redesigned entire application with clean, minimal aesthetic
- Implemented black/white/grey color scheme with geometric divisions
- Added monospace typography for code elements, sans-serif for headings
- Created minimal card layouts with subtle borders and hover effects
- Enhanced with geometric section dividers and grid backgrounds
- Maintained all existing functionality while improving visual hierarchy