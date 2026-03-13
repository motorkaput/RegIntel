# RegIntel — Regulatory Intelligence Platform

## Overview
RegIntel is a full-stack AI-powered regulatory intelligence SaaS platform for BFSI organizations. It provides document ingestion (Mistral OCR), legal unit segmentation, obligation extraction (GPT-4o/4.1), controls/evidence mapping, and comprehensive audit trails. The platform features a React frontend with a professional enterprise design and a Node.js/Express backend with PostgreSQL. It is rebranded from the former "FetchPatterns RegTech" application.

## User Preferences
Preferred communication style: Simple, everyday language.
Design preference: Mature, professional look inspired by Palantir.com.

## Recent Changes (March 13, 2026)
✓ **RegIntel Rebrand - COMPLETED**: All references to "FetchPatterns RegTech" / "FPRT" replaced with "RegIntel" across frontend and backend
✓ Old non-RegTech pages deleted (about, beta-login, contact, fetch-patterns, how-to, landing, permeate-*, pricing, privacy, security, subscription, terms, etc.)
✓ Old non-RegTech components deleted (navbar, footer, dynamic-hero, pricing-cards, etc.)
✓ App.tsx rebuilt with RegTech-only routing — root URL (`/`) shows RegIntel login page
✓ Authentication: Email/password login via `/api/auth/login`, session-based with connect-pg-simple
✓ Admin: david@darkstreet.org / 43g1n73l!
✓ Database schema includes all RegTech tables (regulatory_documents, document_chunks, obligations, etc.) + pgvector extension
✓ RegIntel Implementation Guide created at `attached_assets/REGINTEL_SETUP_GUIDE.md` for deploying as independent project

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Styling**: Professional light theme with enterprise-focused slate/indigo color palette

### Backend
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM
- **Authentication**: Email/password with bcrypt, express-session backed by PostgreSQL (connect-pg-simple)
- **File Processing**: Multer for file uploads (in-memory storage, 10MB limit)

### Data Storage
- **Database**: PostgreSQL (Neon serverless) with pgvector extension
- **ORM**: Drizzle ORM with a schema-first approach
- **Migrations**: Drizzle Kit (`npx drizzle-kit push --force`)

### Key Features
- **RegIntel Core**: Document Library, Console, Query AI, Diff Comparison, Obligations Analysis, Alerts, Sessions, Guide, Admin Panel, User Profile
- **Document Processing**: Mistral OCR 3 for document ingestion, text extraction from PDF/DOCX/images, AI-powered analysis
- **Legal Unit Segmentation**: Rule-pack-based segmentation of regulatory documents
- **Obligation Extraction**: GPT-4o/4.1 powered extraction of regulatory obligations with confidence scoring
- **Vector Search**: pgvector embeddings (text-embedding-3-large) for semantic document retrieval
- **Session Archives**: Word document export of analysis sessions

### Authentication
- Login: POST `/api/auth/login` (email + password)
- Session: GET `/api/auth/me`
- Logout: POST `/api/auth/logout`
- Checks both `users` and `regtech_users` tables

### Active Pages & Routes
- `/` — RegIntel login page (regtech-landing.tsx)
- `/regtech/documents` — Document Library
- `/regtech/console` — Analysis Console
- `/regtech/query` — Query AI
- `/regtech/diff` — Document Diff
- `/regtech/alerts` — Alert Configuration
- `/regtech/obligations-analysis` — Obligations Analysis
- `/regtech/sessions` — Session Management
- `/regtech/guide` — How It Works guide
- `/regtech/admin` — Admin Panel
- `/regtech/profile` — User Profile

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL connection management
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **bcrypt**: Password hashing
- **connect-pg-simple**: PostgreSQL session store
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
- **docx**: Word document generation
- **OpenAI API**: GPT-4o/4.1 for obligation extraction and query answering
- **Mistral API**: OCR 3 for document ingestion
