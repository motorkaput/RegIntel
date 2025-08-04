# Dark Street Tech & Fetch Patterns - Offline Backup Instructions

## What's Been Backed Up

Your complete Dark Street Tech ecosystem has been backed up including:

### Applications
1. **Dark Street Tech** - Main SaaS platform with AI-powered document analysis
2. **Fetch Patterns** - Document processing with word cloud visualization
3. **PerMeaTe Enterprise** - Business performance management platform

### Files Included
- **Complete source code** (client/, server/, shared/)
- **Configuration files** (package.json, tsconfig.json, vite.config.ts, etc.)
- **Documentation** (replit.md, README files)
- **Uploaded assets** (all files in attached_assets/)
- **Database schema** structure
- **Project configuration** (.replit, components.json, etc.)

## How to Download Your Backup

### Option 1: Download Files Directly from Replit
1. In the Replit file explorer, look for:
   - `darkstreet-tech-backup-YYYYMMDD-HHMMSS/` (folder)
   - `darkstreet-tech-backup-YYYYMMDD-HHMMSS.tar.gz` (compressed file)

2. Right-click the `.tar.gz` file and select "Download"

### Option 2: Use Replit Shell Commands
1. Open the Shell in your Replit
2. Run: `ls -la darkstreet-tech-backup-*` to see backup files
3. Download via browser by navigating to the file

### Option 3: Create Additional Archive Formats
```bash
# Create ZIP archive (Windows friendly)
zip -r darkstreet-backup.zip darkstreet-tech-backup-*/

# Create TAR archive (Linux/Mac)
tar -cf darkstreet-backup.tar darkstreet-tech-backup-*/
```

## What to Do with Your Backup

### On Your Local Machine
1. Extract the backup: `tar -xzf darkstreet-tech-backup-*.tar.gz`
2. Navigate to the folder: `cd darkstreet-tech-backup-*/`
3. Install dependencies: `npm install`
4. Set up your database and environment variables
5. Run: `npm run dev`

### Environment Variables You'll Need
Create a `.env` file with:
```
DATABASE_URL=your_postgresql_url
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
RAZORPAY_KEY_ID=your_razorpay_key (optional)
RAZORPAY_KEY_SECRET=your_razorpay_secret (optional)
```

### Database Setup
1. Create a PostgreSQL database
2. Update DATABASE_URL in your .env file
3. Run: `npm run db:push` to create tables

## Key Features Preserved

### Dark Street Tech
- Document upload and processing (PDF, DOCX, XLSX, PPTX)
- AI-powered sentiment analysis and quality scoring
- Performance analytics dashboard
- Subscription management
- User authentication

### Fetch Patterns  
- Advanced document processing
- Word cloud generation with D3.js
- Fibonacci spiral layout algorithm
- Export capabilities (PNG, data)
- Professional document analysis

### PerMeaTe Enterprise
- Multi-tenant business management
- CSV-based employee onboarding
- AI-powered goal breakdown
- Project and task management
- Performance tracking

## Backup Created
Date: $(date)
Size: $(du -sh darkstreet-tech-backup-* 2>/dev/null | cut -f1 | head -1)

## Next Steps
1. Download the backup file(s)
2. Store safely on your local machine
3. Test the restoration process in a local environment
4. Keep environment variables secure and separate

Your complete application ecosystem is now safely backed up and ready for offline storage!