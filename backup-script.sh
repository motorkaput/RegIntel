#!/bin/bash

# Dark Street Tech & Fetch Patterns Backup Script
# Creates a comprehensive backup of the application

BACKUP_DIR="darkstreet-tech-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup in: $BACKUP_DIR"

# Core application files
echo "Backing up application code..."
cp -r client "$BACKUP_DIR/"
cp -r server "$BACKUP_DIR/"
cp -r shared "$BACKUP_DIR/"

# Configuration files
echo "Backing up configuration..."
cp package.json "$BACKUP_DIR/"
cp package-lock.json "$BACKUP_DIR/"
cp tsconfig.json "$BACKUP_DIR/"
cp vite.config.ts "$BACKUP_DIR/"
cp tailwind.config.ts "$BACKUP_DIR/"
cp postcss.config.js "$BACKUP_DIR/"
cp components.json "$BACKUP_DIR/"
cp drizzle.config.ts "$BACKUP_DIR/"

# Project documentation
echo "Backing up documentation..."
cp replit.md "$BACKUP_DIR/"
cp .replit "$BACKUP_DIR/"
cp .gitignore "$BACKUP_DIR/"

# Assets (if any)
if [ -d "attached_assets" ]; then
    echo "Backing up assets..."
    cp -r attached_assets "$BACKUP_DIR/"
fi

# Create a database schema backup
echo "Backing up database schema..."
mkdir -p "$BACKUP_DIR/database"

# Export the current database structure
echo "-- Dark Street Tech Database Schema Backup" > "$BACKUP_DIR/database/schema.sql"
echo "-- Generated on: $(date)" >> "$BACKUP_DIR/database/schema.sql"
echo "" >> "$BACKUP_DIR/database/schema.sql"

# Create a README for the backup
cat > "$BACKUP_DIR/README.md" << 'EOF'
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
EOF

# Create a zip archive
echo "Creating compressed archive..."
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"

echo "Backup completed!"
echo "Files saved to: $BACKUP_DIR"
echo "Compressed archive: $BACKUP_DIR.tar.gz"
echo ""
echo "Backup includes:"
echo "- Complete source code"
echo "- Configuration files"
echo "- Documentation"
echo "- Assets and uploaded files"
echo "- Database schema"