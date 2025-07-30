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

**PerMeaTe Enterprise Application Updates (July 30, 2025)**
- ✅ **CSV-Only File Upload**: Simplified to CSV files only, removed Excel processing complexity
- ✅ **UI Restructuring**: Moved PerMeaTe header to top, removed duplicate navbar
- ✅ **Sticky Navigation**: Made function tabs (Overview, Goals, Projects, Analytics, Users) sticky
- ✅ **User Management System**: Planning multi-user authentication with email aliases and cryptographic passwords
- ✅ **Organization Chart**: Implementing clickable, drill-down organization chart from CEO level
- ✅ **Footer Simplification**: Using Dark Street Tech icon only in footer

**PerMeaTe Enterprise Application Complete (July 29, 2025)**
- ✅ **Administrator Onboarding Wizard**: Complete 3-step setup process
  * Company information capture (name, business areas, employee count, locations)
  * Employee CSV/Excel upload with AI-powered analysis using OPENAI_API_KEY_PE
  * Data review and completion confirmation
- ✅ **Multi-User System Architecture**: Four user types implemented
  * Administrator (AdminUser): Password 7c2f5a1d8b4e9c6f3a0d2b5e8c1f4a7b
  * Project Leader (ProjectLeader): Password pl_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  * Team Member (TeamMember): Password tm_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
  * Organization Leader (OrgLeader): Password ol_z3x1c5v7b9n2m4k6j8h0g2f4d6s8a0q2
- ✅ **OpenAI Integration**: All AI features use OPENAI_API_KEY_PE
  * Excel/CSV file analysis for employee data extraction
  * AI-powered goal breakdown with projects and tasks
  * Performance analytics with insights and recommendations
- ✅ **Complete Application Features**:
  * Goal management with AI-generated project breakdowns
  * Project tracking with intelligent task assignment
  * User management with role-based access control
  * AI-powered performance analytics dashboard
  * Employee data management with smart CSV/Excel processing
- ✅ **Professional Enterprise UI**: Matching Dark Street Tech design system
- ✅ **Fixed Excel Processing**: Proper XLSX library integration for Excel file analysis
- ✅ **Separate URLs**: /z9m3k/pe-workspace (different from Fetch Patterns /z8f4x/fp-workspace)
- ✅ **User Updates (July 29, 2025)**:
  * Login page text changed to "PerMeaTe Enterprise Beta Access"
  * Username changed from "EnterpriseUser" to "AdminUser" 
  * Added re-onboarding option for administrators with "Re-onboard" button
  * localStorage clearing functionality to restart onboarding wizard with fresh CSV/Excel data
  * Fixed Excel file processing using XLSX library for proper organizational data analysis

**Beta Authentication System Implementation (July 27, 2025)**
- ✅ **Custom Beta Login System**: Implemented username/password authentication for controlled access
  * Username: BetaUser
  * Password: 9f4e7d2a8b1c5e3f6a0d7b9c2e4f8a1b (cryptic hash)
- ✅ **Session-Based Authentication**: Uses sessionStorage for auth state management
- ✅ **Protected App Access**: FetchPatterns app now requires beta authentication
- ✅ **Styled Login Page**: Professional login form matching app design
- ✅ **Word Cloud Export Enhancement**: Clean PNG export with only title and date, no UI elements
- ✅ **Launch Button Integration**: Fetch Patterns page redirects to beta login instead of direct app access
- ✅ **Complete Feature Testing**: All document processing, Q&A, and export features confirmed working

**PDF/PPTX Processing Fix & UI Enhancement (July 23, 2025)**
- ✓ **Fixed PDF/PPTX Processing**: Implemented comprehensive document analysis using Python-inspired approach:
  * PDF processing: Enhanced OpenAI Vision API with expert prompting and 3000 token limit for thorough text extraction
  * PPTX processing: Direct XML parsing using JSZip library mimicking Python's pptx library functionality
  * Fixed TypeScript compatibility issues with regex patterns and Set iteration
  * Enhanced error detection to distinguish extraction failures from minimal content documents
- ✓ **Sticky App Header**: Made FetchPatterns header sticky with compact design matching user header height
  * Reduced icon size from h-16 to h-10 and padding from py-6 to py-3
  * Session controls positioned in header bar for always-visible access
  * Header stays in place during scroll with proper z-index layering
- ✓ **UI Improvements**: Removed emoji icon from word cloud empty state for cleaner interface
- ✓ **TypeScript Fixes**: Fixed user type casting in navbar component for proper authentication display
- ✓ **File Selection UI**: Improved file selection display text showing "X files selected" clearly
- ✓ **Error-free Operation**: All LSP diagnostics resolved, system running without TypeScript errors

**Comprehensive UI Polish & Consistency Fixes (July 23, 2025)**
- ✓ **Unified Styling**: Applied consistent responsive typography and spacing across all marketing pages
- ✓ **Legal Pages Update**: Privacy, Terms, and Security pages now use professional dark theme styling
- ✓ **Contact Page Polish**: Improved contact page layout with proper container styling and responsive text
- ✓ **About Page Enhancement**: Updated About page to match design system with proper section dividers
- ✓ **Navigation Consistency**: All pages now use unified header/footer architecture with proper authentication display
- ✓ **Responsive Design**: Ensured all text scales properly with responsive-xl/md/sm classes
- ✓ **Professional Theme**: Maintained sophisticated enterprise design across website and app
- ✓ **TypeScript Resolution**: Fixed all authentication type casting issues in home.tsx and navbar.tsx

**Header Alignment & Smart Navigation Implementation (July 23, 2025)**
- ✓ **Perfect Header Alignment**: Fixed FetchPatterns app header to align with Dark Street Tech navbar using consistent container classes
- ✓ **Smart Navigation System**: Implemented intelligent navigation behavior - when on app, other links open in new tabs to preserve work
- ✓ **Footer Link Cleanup**: Removed duplicate darkstreet.consulting link and fixed internal links to not open new tabs unnecessarily
- ✓ **Sticky Header Fix**: Made FetchPatterns header container sticky during scroll with proper z-index positioning
- ✓ **Session Controls Styling**: Aligned session controls with user authentication styling for visual consistency
- ✓ **Navigation Preservation**: Users can now navigate away from app without losing document analysis progress
- ✓ **Sticky Header Fixed**: Corrected top positioning from top-24 to top-36 to account for full navbar height including authentication line (136px total)

**Comprehensive UI Polish & Consistency Fixes (July 23, 2025)**
- ✓ **Session Text Pluralization**: Fixed "1 docs analyzed" to properly display "1 doc analyzed" for singular documents
- ✓ **Stylish Hero Sections**: Redesigned all hero sections with gradient backgrounds, improved spacing, and minimalist aesthetic
  * Added gradient background (from-surface-white via-surface-light to-surface-grey) and increased padding to py-16
  * Enhanced typography with font-light, tracking-tight, and leading-relaxed for professional appearance
  * Added accent line with blue gradient for visual sophistication
- ✓ **Text Updates**: Updated PerMeaTe Enterprise headline to "Where goals turn into real, measurable work" and About page to sentence case
- ✓ **Leadership Information**: Updated About page with correct CEO/COO titles and detailed professional backgrounds:
  * Barsha Panda - CEO: Business strategist with global experience at Yahoo and Oracle
  * David Jairaj - COO: Process and tech architect across art, design, product development, and performance measurement
- ✓ **Contact Page Simplification**: Streamlined to single-column message form, removed Contact Information and Office Hours sections
- ✓ **Professional Hero Design**: All pages now feature consistent, sophisticated hero sections with gradient backgrounds and accent lines

**Streamgraph Background Hero Sections (July 23, 2025)**
- ✓ **Single-Line Text Format**: Redesigned all hero sections with colon-separated format ("Title: Subtitle") in consistent weight and size
- ✓ **Tight Line Spacing**: Reduced leading to "leading-tight" for compact multi-line headlines
- ✓ **D3.js Streamgraph Backgrounds**: Implemented animated streamgraph visualization based on Observable's streamgraph-transitions:
  * Organic flowing layers with smooth curves using d3.curveBasis
  * Random color schemes from D3's color palettes (Blues, Greens, Purples, Oranges, Reds, Greys) - changes per refresh  
  * Wiggle offset and inside-out ordering for natural streamgraph appearance
  * Low opacity (0.15-0.2) for subtle background texture with high text contrast
  * Smooth animation transitions on component mount
- ✓ **Logo Size Reduction**: Reduced Dark Street Tech logo from h-16 to h-10 (40px) to match FetchPatterns icon height
- ✓ **Responsive SVG Rendering**: Streamgraphs automatically adapt to container dimensions with proper scaling
- ✓ **Performance Optimized**: SVG-based rendering with efficient D3.js stack generation and curve interpolation
- ✓ **Increased Hero Height**: Expanded hero section padding from py-12 to py-20 (150% increase) for more prominent streamgraph display

**Production Deployment Ready (July 24, 2025)**
- ✅ **Custom Authentication System**: Replaced Replit branding with simple email-based login
- ✅ **Fixed PNG Word Cloud Export**: Implemented html2canvas for high-quality image downloads
- ✅ **Added CSV Export for Q&A**: Users can now download question-answer sessions as CSV files
- ✅ **Three Export Improvements**:
  * PNG word cloud export with proper canvas rendering and error handling
  * CSV export for "Ask Questions" section with question, answer, and confidence data
  * Enhanced CSV export for Context-Based Sentiment Analysis with all session data
- ✅ **Removed Replit Dependencies**: Custom authentication without external branding requirements
- ✅ **Free Access Model**: Simple email-based signup with no password requirements
- ✅ **Production Database**: PostgreSQL database configured and running for live environment
- ✅ **Complete Feature Set**: Full marketing website + functional Fetch Patterns SaaS application
- ✅ **Ready for darkstreet.tech**: All systems prepared for custom domain deployment
- ✅ **Launch Button Fixed**: Removed target="_blank" redirect, now uses proper React routing to custom auth
- ✅ **Authentication Working**: Tested login system - users get instant access with email only
- ✅ **Build Successful**: Production build completed and ready for deployment
- ✅ **Beta Invite System**: Implemented whitelist-based access control for selective user onboarding
- ✅ **Fixed Login Errors**: Resolved authentication issues and improved error handling
- ✅ **Updated Messaging**: Removed "completely free" language, now shows "beta access only"

**Document Analysis & UI Enhancement Implementation (July 22, 2025)**
- ✓ **Real Document Text Extraction**: Implemented authentic content extraction for all major file formats:
  * DOCX files: mammoth.js library for complete text extraction
  * PDF files: Proper fallback message "Unable to analyze this document. Please write to hello@darkstreet.org with this bug."
  * Excel files (.xlsx/.xls): XLSX library for full spreadsheet data extraction with sheet processing
  * Image files (.png/.jpg/.gif): OpenAI vision API for OCR and visual content transcription
  * PPTX files: Proper fallback message directing users to support email
- ✓ **UI/UX Improvements**: 
  * Replaced FetchPatterns logo with square icon matching Dark Street Tech logo height (h-16)
  * Reduced line spacing between headlines and lead-in text on all website pages (space-y-4)
  * Fixed About page navigation - added proper header/footer for UI consistency
  * Enhanced word cloud with Fibonacci spiral algorithm (golden angle) to eliminate all overlapping
  * Improved document summary chip layout - moved classification and highlights to separate row with proper truncation
- ✓ **Document Classification System**: Simplified to broad categories (Strategy, Financial, Marketing, Legal, Operations, Business, Technical, HR)
- ✓ **Word Cloud Implementation**: D3.js-based professional word cloud with zero overlaps guaranteed, 14-60px adaptive font scaling, Archimedean spiral layout, Roboto font styling, and seamless data integration matching user's local React app functionality
- ✓ **Progress Tracking**: Professional progress bar with textual states (Uploading... Analyzing... Fetching patterns... Done) replacing toast notifications
- ✓ **Auto-scroll Navigation**: Automatic scroll to session metrics boxes (not middle of section) after analysis completion
- ✓ **UI Layout Optimization**: Moved "Ask Questions" section below Document Summaries for better workflow
- ✓ **PDF/PPTX Processing**: Implemented real text extraction using pdf-parse and pptx-parser libraries for full document analysis
- ✓ **Enhanced Error Handling**: Fixed overly broad error detection that was incorrectly marking valid PDF/PPTX content as "Undeterminable"
- ✓ **Session Status Visibility**: Made session status bar sticky and only visible after analysis completion (not during progress), ensuring users can always access the refresh button
- ✓ **Failed Analysis Handling**: Documents that can't be analyzed show "Undeterminable" classification chip with exact error message
- ✓ **CSV Export Fix**: Context-Based Sentiment Analysis now exports ALL session contexts, not just the last one
- ✓ **Color Consistency**: Context Analysis colors now match Document Summaries (blue for positive, purple for negative, gray for neutral)
- ✓ **Cumulative Upload**: Users can upload files, close dialog, then upload more - files accumulate until "Upload and Analyze" is clicked
- User issues resolved: PDF/PPTX dummy content, word cloud overlapping completely eliminated, CSV export includes all contexts, color consistency achieved

**Phase 2 Updates - Session-Based Document Management (July 21, 2025)**
- Fixed all user-reported issues in Fetch Patterns SaaS application:
  * Removed "React App" header text from top right corner
  * Removed all section icons (Upload Documents, Ask Questions, etc.) for cleaner design
  * Implemented session-based document handling instead of cumulative storage
  * Added session refresh warning with blue info card and "Refresh Session" button
  * Fixed question answering and context analysis to work with session documents
  * Enhanced word cloud with customizable word count input (default 50), Roboto Light font, tighter spacing
  * Added comprehensive legal pages (Privacy, Terms, About, Contact, Security) with footer navigation
  * Fixed upload limit issue - changed from database subscription limits to session-based limits (20 docs per session)
  * Added real-time polling to update analysis results as documents finish processing
- Session management ensures users work with document sets that are meaningful in their current context
- Documents are automatically cleared on page refresh with proper user warnings to save exports first
- Authentication configuration improved for better Replit environment compatibility

**Latest User Experience Improvements (July 21, 2025)**
- ✓ Fixed scroll-to-top functionality - app now loads at header position after document upload
- ✓ Enhanced AI analysis quality with more specific document summaries and detailed insights extraction
- ✓ Redesigned word cloud with clean, readable layout using Roboto Light font without rotation angles
- ✓ Updated all contact information across all pages to hello@darkstreet.org and darkstreet.tech
- ✓ Added Excel file support (.xlsx/.xls) to prevent unsupported file type errors during upload
- ✓ Improved document processing with better error handling and content extraction
- ✓ **UNIFIED HEADER/FOOTER ARCHITECTURE**: Implemented consistent navigation across all pages
- ✓ **TWO-LINE NAVBAR DESIGN**: Separated main navigation from user authentication for better UX
- ✓ **CONSISTENT BRANDING**: FetchPatterns app now uses shared Dark Street Tech navbar and footer
- ✓ Fixed header alignment issues and standardized user display across website and app
- ✓ Implemented consistent user authentication display with distinct styling (User icon, white rounded background)
- ✓ Updated copyright messages to "Copyright Dark Street. All rights reserved." across all pages  
- ✓ Made footer links in FetchPatterns app open in new tabs with proper navigation
- ✓ User authentication now appears on separate line below main navigation links for better visual hierarchy
- Word cloud now uses professional flex-wrap layout with proper spacing and hover effects

**Phase 2 Complete - Fetch Patterns SaaS Integration (July 21, 2025)**
- Successfully integrated complete Fetch Patterns AI-powered document analysis SaaS application
- **Perfect UI Match**: Redesigned interface to exactly match original FetchPatterns design from user's GitHub repository
- **Real OpenAI Integration**: Full gpt-4o API integration for authentic document analysis (no mock data)
- **Complete Feature Set**: Multi-file upload, question answering, context-based sentiment analysis, interactive word cloud
- **Export Functionality**: Working CSV and PNG export capabilities for all analysis results
- Built comprehensive document analysis system with AI processing capabilities:
  * Multi-file upload support (PDF, DOCX, PPTX, TXT, images)
  * Real-time processing status tracking with async AI analysis
  * Sentiment analysis, keyword extraction, and classification
  * Question answering system using uploaded documents as context
  * Context-based sentiment analysis with emotional tone detection
  * Interactive word cloud visualization with proper styling
  * Document summaries with AI-generated insights and classifications
- **Authentic Design Implementation**: Light theme, FetchPatterns logo, exact layout matching original screenshots
- Added dedicated database schema for document analysis with PostgreSQL storage
- Implemented subscription-based usage limits and authentication protection
- Enabled launch button on Fetch Patterns marketing page linking to live SaaS app
- Domain deployment framework ready for darkstreet.tech production launch

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

**Previous Design System Implementation (July 16, 2025)**
- Integrated Roboto Light font (weight 300) for body text
- Created comprehensive loading system with Dark Street Tech branding
- Implemented eye-peeking animation for logo icon
- Built VS Code-inspired minimal design with geometric divisions
- Added section dividers and clean card layouts
- Removed authentication from public marketing pages