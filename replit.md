# Dark Street Tech - AI-Powered SaaS Platform

## Overview
Dark Street Tech is a full-stack AI-powered SaaS platform providing document analysis and performance analytics. It features a React frontend with a dark cyberpunk aesthetic and a Node.js/Express backend with PostgreSQL. The platform aims to offer robust solutions for businesses, enabling efficient document processing, insightful performance analytics, and streamlined subscription management, with a vision for significant market impact.

## User Preferences
Preferred communication style: Simple, everyday language.
Design preference: Mature, professional look inspired by Palantir.com instead of quirky/neon design.

## Recent Changes (August 11, 2025)
✓ **PerMeaTe Enterprise Next.js Migration - COMPLETED**
✓ Migrated from Express.js to Next.js 14 app router architecture
✓ Created Next.js API route handlers with RLS integration on all database calls
✓ Implemented JWT authentication with HttpOnly cookies
✓ Built magic link authentication system with Postmark email integration
✓ Created invitation system with email templates and token-based acceptance
✓ Added middleware for route protection and authentication validation
✓ All API endpoints now use withRLS wrapper for Row Level Security compliance
✓ Comprehensive API documentation updated for Next.js route handlers
✓ Email templates for magic links and invitations implemented
✓ Bootstrap token system for initial organization setup
✓ Development email fallback system with DEV_EMAIL_MODE=console
✓ Authentication pages created (login, register, dashboard) with proper Next.js app structure
✓ Environment configuration completed with all required variables and development fallbacks

## Previous Changes (August 9, 2025)
✓ Completely removed entire open beta system from codebase per user request
✓ Cleaned up schema definitions by removing openBetaUsers and openBetaDocumentAnalyses tables
✓ Removed all open beta storage functions and API routes from server
✓ Deleted open beta frontend components and routes from client
✓ Dropped open beta database tables (open_beta_users, open_beta_document_analyses)
✓ Maintained white-label authentication approach without external service branding
✓ Preserved closed beta (main Dark Street Tech) system security and functionality
✓ System now focused exclusively on three core applications: Dark Street Tech, Fetch Patterns (closed beta), and PerMeaTe Enterprise
✓ Completely removed Enhanced Fetch Patterns system per user request
✓ Deleted all enhanced user components, routes, and API endpoints
✓ Original Fetch Patterns authentication: `/beta-login` with Username: "BetaUser" / Password: "9f4e7d2a8b1c5e3f6a0d7b9c2e4f8a1b"
✓ Beta2 version completely removed due to persistent issues - system now uses single Beta version only

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Styling**: Professional dark theme with a sophisticated blue color palette and enterprise-focused design. All elements use `max-w-7xl` for alignment, consistent `px-4 sm:px-6 lg:px-8` padding, and `h-12` (48px) uniform header heights with `h-6` (24px) logo sizing, ensuring zero gap positioning and seamless scrolling.

### Backend  
- **Framework**: Next.js 14 with TypeScript and App Router
- **Runtime**: Node.js with ES modules
- **Database ORM**: Prisma with PostgreSQL
- **Authentication**: JWT with HttpOnly cookies, magic links, and invitations
- **Email**: Postmark for transactional emails
- **Security**: Row Level Security (RLS) on all database operations

### Data Storage
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with a schema-first approach
- **Migrations**: Drizzle Kit

### Key Features
- **Authentication System**: Replit Auth integration, PostgreSQL-backed sessions, automatic user creation, HTTP-only cookies.
- **Document Processing**: Simulated OCR, text extraction, mock AI analysis (sentiment, quality scoring), and performance tracking. Supports DOCX, PDF, XLSX, images, and PPTX with robust error handling and progress tracking. Includes features like word clouds (Fibonacci spiral, no overlap), document summarization, and classification.
- **Subscription Management**: Razorpay integration for payments, flexible plans, 30-day free trial.
- **Performance Analytics**: Metrics collection, real-time dashboards (using Recharts), trend analysis, and report generation.
- **PerMeaTe Enterprise Module**: Administrator onboarding wizard, multi-user system (Administrator, Project Leader, Team Member, Organization Leader), OpenAI integration for goal breakdown and intelligent task assignment, authentic CSV processing for organizational structure and employee import, and comprehensive data persistence. Features professional enterprise UI matching Dark Street Tech design.

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL connection management
- **drizzle-orm**: Type-safe database operations
- **@prisma/client**: PerMeaTe Enterprise ORM for multi-tenant data access
- **prisma**: Database schema management and migrations
- **@tanstack/react-query**: Server state management
- **passport**: Authentication middleware
- **razorpay**: Payment processing
- **multer**: File upload handling
- **@radix-ui/**: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **recharts**: Chart and visualization library
- **vite**: Frontend build tool
- **typescript**: Type safety
- **drizzle-kit**: Database schema management
- **esbuild**: Production backend bundling
- **mammoth.js**: DOCX text extraction
- **XLSX**: Spreadsheet data extraction
- **html2canvas**: PNG export for word clouds
- **d3.js**: Streamgraph backgrounds and word cloud visualization
- **D3's color palettes**: For streamgraph visualization
- **OpenAI API**: For AI-powered analysis (e.g., GPT-4o for PerMeaTe Enterprise)
- **JSZip**: PPTX direct XML parsing