# Dark Street Tech - AI-Powered SaaS Platform

## Overview
Dark Street Tech is a full-stack AI-powered SaaS platform providing document analysis and performance analytics. It features a React frontend with a dark cyberpunk aesthetic and a Node.js/Express backend with PostgreSQL. The platform aims to offer robust solutions for businesses, enabling efficient document processing, insightful performance analytics, and streamlined subscription management, with a vision for significant market impact.

## User Preferences
Preferred communication style: Simple, everyday language.
Design preference: Mature, professional look inspired by Palantir.com instead of quirky/neon design.

## Recent Changes (August 1, 2025)
✓ Resolved critical PostgreSQL array handling for company onboarding
✓ Fixed database schema inconsistencies and column mismatch issues  
✓ Implemented comprehensive employee authentication system with CSV credential support
✓ "Complete Setup & Launch PerMeaTe" button now fully functional
✓ Employee login system working with proper database persistence
✓ Both OnboardingExpertUser and employee workflows operational
✓ PerMeaTe Enterprise ready for deployment as standalone application
✓ Simple access URL created: `/m8x3r/pe-system` for clean PerMeaTe Enterprise access
✓ "Launch PerMeaTe Enterprise" button added to Dark Street Tech website, opens app in new tab
✓ Fixed employee authentication routing - employees now go to dashboard, not onboarding
✓ Added authentication persistence with localStorage for seamless user experience
✓ Implemented proper company data fetching during employee login
✓ Replit webview display issue identified as platform infrastructure problem (app working correctly on server)

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Styling**: Professional dark theme with a sophisticated blue color palette and enterprise-focused design. All elements use `max-w-7xl` for alignment, consistent `px-4 sm:px-6 lg:px-8` padding, and `h-12` (48px) uniform header heights with `h-6` (24px) logo sizing, ensuring zero gap positioning and seamless scrolling.

### Backend
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect, managing sessions via PostgreSQL.
- **File Processing**: Multer for file uploads (in-memory storage, 10MB limit).

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