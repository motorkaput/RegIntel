# Dark Street Tech & Fetch Patterns Backup

This backup contains the complete Dark Street Tech application including:

## Applications Included
1. **Dark Street Tech** - Main SaaS platform with document analysis
2. **Fetch Patterns** - Document processing and word cloud visualization  
3. **PerMeaTe Enterprise** - Business performance management platform

## Structure
- `client/` - React frontend with TypeScript
- `server/` - Express.js backend with TypeScript  
- `shared/` - Shared types and schemas
- `database/` - Database schema and structure
- `attached_assets/` - Uploaded files and assets

## Technologies
- Frontend: React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Express.js, TypeScript, Drizzle ORM
- Database: PostgreSQL (Neon serverless)
- Build: Vite, ESBuild
- Authentication: Replit Auth (OpenID Connect)

## Key Features
- Document processing (PDF, DOCX, XLSX, PPTX)
- AI-powered analysis with OpenAI integration
- Word cloud visualization with D3.js
- Subscription management with Razorpay
- Multi-tenant architecture
- Enterprise workflow management

## To Restore
1. Install Node.js and npm
2. Run `npm install` 
3. Set up PostgreSQL database
4. Configure environment variables
5. Run `npm run db:push` for database setup
6. Start with `npm run dev`

## Environment Variables Needed
- DATABASE_URL
- OPENAI_API_KEY
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- SESSION_SECRET
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

Backup created on: $(date)
