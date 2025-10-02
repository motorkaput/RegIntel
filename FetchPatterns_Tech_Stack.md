# FetchPatterns - Technical Stack Documentation

## Architecture Overview

FetchPatterns is built as a modern, full-stack web application using a React frontend, Node.js backend, and PostgreSQL database. The architecture emphasizes performance, scalability, and user experience while leveraging cutting-edge AI technologies for document analysis.

---

## Frontend Technologies

### Core Framework
**React 18 with TypeScript**
- **Purpose**: Building interactive user interface with type safety
- **Why**: Industry-standard for modern web apps, excellent performance, strong ecosystem
- **Benefits**: Component reusability, efficient updates, developer productivity

### Build Tool
**Vite**
- **Purpose**: Fast development server and optimized production builds
- **Why**: 10-100x faster than traditional bundlers, instant hot module replacement
- **Benefits**: Lightning-fast development experience, optimized bundle sizes

### Routing
**Wouter**
- **Purpose**: Client-side routing between pages
- **Why**: Lightweight (1.5KB) alternative to React Router with same capabilities
- **Benefits**: Minimal bundle size, simple API, excellent performance

### State Management
**TanStack Query (React Query v5)**
- **Purpose**: Server state management, caching, and synchronization
- **Why**: Industry-leading solution for async data fetching and caching
- **Benefits**: Automatic caching, background updates, optimistic updates, cache invalidation

### UI Framework & Styling
**Tailwind CSS**
- **Purpose**: Utility-first CSS framework for rapid UI development
- **Why**: Highly customizable, no CSS bloat, consistent design system
- **Benefits**: Fast development, small bundle size, maintainable styles

**Shadcn/UI**
- **Purpose**: Accessible, customizable component library
- **Why**: Built on Radix UI primitives with Tailwind styling
- **Benefits**: Full accessibility (ARIA), copy-paste components, complete customization

**Radix UI Primitives**
- **Purpose**: Unstyled, accessible component primitives
- **Why**: Best-in-class accessibility and behavior
- **Components Used**: Dialog, Dropdown, Select, Tooltip, Accordion, Tabs, Toast, and more

### Form Management
**React Hook Form**
- **Purpose**: Performant form validation and management
- **Why**: Minimal re-renders, built-in validation, excellent DX
- **Benefits**: Better performance than alternatives, easy integration with Zod

**Zod**
- **Purpose**: TypeScript-first schema validation
- **Why**: Type-safe validation with excellent TypeScript integration
- **Benefits**: Compile-time type checking, runtime validation, schema reusability

### Icons & Assets
**Lucide React**
- **Purpose**: Icon library for UI elements
- **Why**: Lightweight, consistent design, tree-shakeable
- **Benefits**: Only bundle icons you use, beautiful design, easy to customize

### Data Visualization
**Recharts**
- **Purpose**: Charts and performance dashboards
- **Why**: React-native charts library with good customization
- **Benefits**: Declarative API, responsive, composable components

**D3.js**
- **Purpose**: Word cloud visualization and advanced data viz
- **Why**: Industry standard for complex visualizations
- **Benefits**: Powerful, flexible, extensive ecosystem

**D3-Cloud**
- **Purpose**: Word cloud layout algorithm (Fibonacci spiral)
- **Why**: Optimal word positioning without overlap
- **Benefits**: Beautiful word clouds, configurable layouts

### Export & Rendering
**html2canvas**
- **Purpose**: Convert DOM elements to PNG images
- **Why**: Client-side screenshot generation for word cloud exports
- **Benefits**: No server processing needed, instant downloads

### Animation
**Framer Motion**
- **Purpose**: Smooth animations and transitions
- **Why**: Best-in-class animation library for React
- **Benefits**: Declarative API, physics-based animations, gesture support

---

## Backend Technologies

### Runtime & Framework
**Node.js 20**
- **Purpose**: JavaScript runtime for server-side execution
- **Why**: High performance, large ecosystem, JavaScript everywhere
- **Benefits**: Non-blocking I/O, excellent for real-time applications

**Express.js**
- **Purpose**: Web application framework
- **Why**: Minimal, flexible, battle-tested
- **Benefits**: Middleware ecosystem, simple routing, widely supported

**TypeScript**
- **Purpose**: Type safety on the backend
- **Why**: Catch errors at compile time, better developer experience
- **Benefits**: Refactoring safety, IDE intelligence, code documentation

### Build & Development
**tsx**
- **Purpose**: TypeScript execution for development
- **Why**: Fast TypeScript execution without separate compilation
- **Benefits**: Instant feedback, no build step needed

**esbuild**
- **Purpose**: Production build bundler
- **Why**: 10-100x faster than webpack/rollup
- **Benefits**: Near-instant builds, small output, tree-shaking

---

## Database & Persistence

### Database
**PostgreSQL (Neon Serverless)**
- **Purpose**: Primary data storage for users, documents, analysis results
- **Why**: Robust, ACID-compliant, excellent JSON support, serverless scaling
- **Benefits**: Reliable, scalable, feature-rich, automatic backups

### ORM & Schema Management
**Drizzle ORM**
- **Purpose**: Type-safe database operations
- **Why**: TypeScript-first, excellent performance, SQL-like syntax
- **Benefits**: Full type safety, minimal overhead, direct SQL access when needed

**Drizzle Kit**
- **Purpose**: Database migrations and schema management
- **Why**: Schema-first approach, automatic migration generation
- **Benefits**: Version control for database, safe schema updates

### Session Storage
**PostgreSQL Session Store (connect-pg-simple)**
- **Purpose**: Server-side session storage
- **Why**: Persistent sessions across server restarts
- **Benefits**: Secure, scalable, integrated with main database

---

## Authentication & Security

### Authentication
**Replit Auth with OpenID Connect (OIDC)**
- **Purpose**: User authentication and identity management
- **Why**: Secure, standards-based authentication
- **Benefits**: OAuth 2.0 compliance, automatic user management, secure token handling

**Passport.js**
- **Purpose**: Authentication middleware
- **Why**: Flexible, supports multiple strategies
- **Benefits**: Strategy-based auth, session management, extensible

### Security
**bcrypt**
- **Purpose**: Password hashing (if needed for custom auth)
- **Why**: Industry-standard password security
- **Benefits**: Adaptive hashing, salt generation, brute-force resistant

**HTTP-Only Cookies**
- **Purpose**: Secure session token storage
- **Why**: Protection against XSS attacks
- **Benefits**: Not accessible via JavaScript, secure transmission

---

## AI & Machine Learning

### AI Platform
**OpenAI API (GPT-4)**
- **Purpose**: Document analysis, sentiment analysis, Q&A, summarization
- **Why**: State-of-the-art language understanding
- **Benefits**: Superior accuracy, context awareness, multiple capabilities

### Analysis Capabilities
- **Sentiment Analysis**: Emotional tone detection with confidence scores
- **Text Classification**: Document type categorization
- **Key Insight Extraction**: Important finding identification
- **Risk Flag Detection**: Concern and issue identification
- **Keyword Extraction**: Significant term identification
- **Summarization**: Concise document overviews
- **Question Answering**: Context-aware responses to queries

---

## Document Processing

### File Upload
**Multer**
- **Purpose**: Multipart/form-data handling for file uploads
- **Why**: Standard Node.js file upload middleware
- **Benefits**: Memory/disk storage options, file filtering, size limits
- **Configuration**: In-memory storage, 10MB file size limit

### Document Parsers

**Mammoth.js**
- **Purpose**: DOCX text extraction
- **Why**: Reliable .docx parsing to HTML/text
- **Benefits**: Preserves formatting context, handles complex documents

**XLSX**
- **Purpose**: Excel spreadsheet data extraction
- **Why**: Complete Excel file support (XLS/XLSX)
- **Benefits**: Cell data extraction, formula support, multiple sheets

**pdf-parse**
- **Purpose**: PDF text extraction
- **Why**: Pure JavaScript PDF parsing
- **Benefits**: No native dependencies, handles most PDF types

**JSZip**
- **Purpose**: PPTX file processing (PowerPoint)
- **Why**: PPTX files are ZIP archives with XML content
- **Benefits**: Direct XML access, extract slide text, reliable parsing

---

## Payment Processing

### Payment Gateway
**Razorpay**
- **Purpose**: Subscription billing and payment processing
- **Why**: Leading payment gateway for India and international
- **Benefits**: Multiple payment methods, subscription management, secure processing

---

## Additional Tools & Libraries

### Data Validation
**Zod**
- **Purpose**: Runtime type checking and validation
- **Why**: TypeScript-first schema validation
- **Benefits**: Shared schemas between frontend/backend, compile-time + runtime safety

**Drizzle-Zod**
- **Purpose**: Generate Zod schemas from Drizzle models
- **Why**: Single source of truth for data validation
- **Benefits**: Automatic schema generation, type consistency

### Development Tools
**Drizzle Studio**
- **Purpose**: Database GUI for development
- **Why**: Visual database inspection and editing
- **Benefits**: Easy data viewing, query testing, schema verification

### Date Handling
**date-fns**
- **Purpose**: Date manipulation and formatting
- **Why**: Modern, modular alternative to moment.js
- **Benefits**: Tree-shakeable, immutable, TypeScript support

---

## Technology Decision Rationale

### Why React + TypeScript?
- **Type Safety**: Catch errors before runtime
- **Developer Experience**: Best tooling and IDE support
- **Ecosystem**: Largest component library and tool ecosystem
- **Performance**: Virtual DOM for efficient updates
- **Hiring**: Largest talent pool of developers

### Why Node.js Backend?
- **JavaScript Everywhere**: Same language frontend and backend
- **Performance**: Event-driven, non-blocking I/O
- **Ecosystem**: NPM has packages for everything
- **Real-time**: Excellent for WebSocket/real-time features
- **Scalability**: Proven at enterprise scale

### Why PostgreSQL?
- **Reliability**: ACID compliance, data integrity
- **Features**: JSON support, full-text search, advanced queries
- **Scalability**: Handles growth from startup to enterprise
- **Open Source**: No vendor lock-in, community support
- **Neon**: Serverless scaling, automatic backups

### Why OpenAI?
- **Accuracy**: Best-in-class language understanding
- **Capabilities**: Multiple analysis types from one API
- **Reliability**: Enterprise-grade uptime and support
- **Updates**: Continuous model improvements
- **Cost-Effective**: Pay only for what you use

### Why Tailwind CSS?
- **Productivity**: Rapid UI development
- **Consistency**: Design system built-in
- **Performance**: Purges unused CSS automatically
- **Maintainability**: No CSS file organization needed
- **Customization**: Complete control over design

---

## Infrastructure & Deployment

### Development Environment
- **Platform**: Replit (for development)
- **Hot Reload**: Vite HMR for instant updates
- **Database**: PostgreSQL (Neon) development instance

### Production Build
- **Frontend**: Vite production build (minified, optimized)
- **Backend**: esbuild bundle (single file, tree-shaken)
- **Assets**: Static file serving via Express
- **Bundle Size**: ~600KB JS (gzipped ~175KB)

### Environment Variables
- **Database**: `DATABASE_URL` for PostgreSQL connection
- **OpenAI**: `OPENAI_API_KEY` for AI processing
- **Auth**: OIDC configuration for authentication
- **Session**: Secret key for session encryption

---

## Performance Optimizations

### Frontend
- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: Proper formats and compression
- **Caching**: TanStack Query for intelligent data caching
- **Bundle Optimization**: Tree-shaking, minification

### Backend
- **Database**: Indexed queries, optimized schema
- **Session Store**: PostgreSQL for persistent, fast sessions
- **File Processing**: In-memory uploads for speed
- **API**: Efficient route handlers, minimal middleware

### AI Processing
- **Streaming**: Real-time response streaming (future enhancement)
- **Batching**: Process multiple documents efficiently
- **Caching**: Store results for quick re-access

---

## Security Measures

### Authentication Security
- **OIDC Standard**: Industry-standard authentication flow
- **Session Management**: Secure, HTTP-only cookies
- **Token Security**: Encrypted session tokens

### Data Security
- **Database**: PostgreSQL with SSL connections
- **File Upload**: Size limits, type validation
- **API**: Input validation with Zod schemas
- **Secrets**: Environment variable management

### Application Security
- **TypeScript**: Type safety prevents many bugs
- **Validation**: Double validation (frontend + backend)
- **HTTPS**: Secure transmission in production
- **CORS**: Proper cross-origin configuration

---

## Scalability Considerations

### Current Architecture
- **Stateless Backend**: Easy horizontal scaling
- **Serverless Database**: Automatic scaling with Neon
- **CDN-Ready**: Static assets can be served from CDN

### Future Enhancements
- **Caching Layer**: Redis for frequently accessed data
- **Queue System**: Bull/RabbitMQ for background processing
- **Load Balancing**: Multiple backend instances
- **Microservices**: Separate AI processing service

---

## Development Workflow

### Code Organization
```
/client          → React frontend
  /src
    /components  → Reusable UI components
    /pages       → Application pages/routes
    /hooks       → Custom React hooks
    /lib         → Utilities and config
/server          → Node.js backend
  /routes        → API route handlers
  /services      → Business logic services
/shared          → Shared types and schemas
/dist            → Production build output
```

### Build Process
1. **Development**: `npm run dev` (tsx + vite)
2. **Production Build**: `npm run build` (vite + esbuild)
3. **Database**: `npm run db:push` (Drizzle migrations)

---

## Summary

FetchPatterns leverages modern, proven technologies to deliver a fast, reliable, and scalable document analysis platform. The stack prioritizes:

1. **Developer Experience**: TypeScript, hot reload, excellent tooling
2. **User Experience**: Fast load times, smooth interactions, responsive design
3. **Reliability**: Type safety, validation, error handling
4. **Performance**: Optimized builds, efficient rendering, smart caching
5. **Scalability**: Stateless architecture, serverless database, modular design

The result is a production-ready application that balances cutting-edge technology with proven, stable foundations.
