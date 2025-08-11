# PerMeaTe Enterprise Deployment Guide

## Prerequisites

- Node.js 18+ with npm
- PostgreSQL 14+ database
- Domain with SSL certificate (for production)

## Environment Setup

### Development
```bash
# Install dependencies
npm install

# Set up database schema
npm run db:push

# Set up Row Level Security
npm run db:rls

# Create demo data
npm run demo:seed

# Start development server
npm run dev
```

### Production
```bash
# Build application
npm run build

# Start production server
npm start
```

## Database Configuration

### Required Environment Variables
```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-secure-session-secret
```

### Row Level Security Setup
RLS policies are automatically configured with:
```bash
npm run db:rls
```

## Authentication Configuration

### Magic Link Authentication
```bash
# Email provider (required for production)
POSTMARK_API_TOKEN=your-postmark-token

# Development fallback
DEV_EMAIL_MODE=console  # For development only
```

### Bootstrap Token
Set a secure bootstrap token for initial tenant creation:
```bash
BOOTSTRAP_TOKEN=your-secure-bootstrap-token
```

## Payment Processing

### Razorpay Integration
```bash
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
BILLING_WEBHOOK_SECRET=your-webhook-secret
```

### Mock Mode (Development)
```bash
PAYMENT_PROVIDER=mock
```

## AI Services

### OpenAI Configuration
```bash
OPENAI_API_KEY=your-openai-api-key
```

## File Storage

### Local Development
```bash
DEV_STORAGE_MODE=local
UPLOAD_DIR=./uploads
```

### Production (S3-compatible)
```bash
STORAGE_MODE=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket-name
```

## Security Configuration

### Rate Limiting
```bash
DEFAULT_RATE_LIMIT_QPH=1000  # Queries per hour
```

### Data Retention
Configure via tenant settings or:
```bash
DEFAULT_RETENTION_DAYS=365
```

## End-to-End Testing

### Installation
```bash
# Install Playwright
npm run e2e:install
```

### Setup Test Environment
```bash
# Prepare database
npm run db:migrate && npm run db:rls

# Seed demo data
npm run demo:seed
```

### Running Tests
```bash
# Run all E2E tests
npm run e2e

# Run specific test suite
npx playwright test 01_signup_login

# Run with UI mode
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

### Test Configuration
Tests use `.env.test` configuration:
- Ephemeral test database
- Console-based email delivery
- Mock payment processing
- Reduced rate limits for faster testing

### Test Coverage
The E2E test suite covers:

1. **01_signup_login.spec.ts** - Tenant registration and authentication
2. **02_csv_onboarding.spec.ts** - Organization data upload and validation
3. **03_ai_proposals.spec.ts** - AI proposal creation, review, and modification
4. **04_scoring.spec.ts** - Task scoring workflow and permissions
5. **05_tracking_integrations.spec.ts** - Kanban board and external integrations
6. **06_dashboards.spec.ts** - Analytics dashboards and drill-down functionality
7. **07_billing.spec.ts** - Billing portal, usage tracking, and payment processing

### Demo Mode
For demonstration purposes:
```bash
# Start with demo data
npm run demo:start
```

This creates a complete DemoCo tenant with:
- Realistic organizational structure
- Sample users across all roles
- Projects and tasks with scores
- AI proposals and evaluations
- Usage events and billing data

## Monitoring and Maintenance

### Health Checks
The application provides health check endpoints:
- `GET /health` - Basic health status
- `GET /api/health` - Detailed system status

### Audit Logging
All administrative actions are automatically logged with:
- User identification
- Timestamp and action type
- Before/after values
- Request metadata

### Data Backup
Configure automated database backups:
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### SSL/TLS Configuration
For production deployment:
1. Obtain SSL certificate for your domain
2. Configure reverse proxy (nginx/Apache)
3. Set secure cookie flags
4. Enable HSTS headers

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL format
- Check PostgreSQL service status
- Ensure network connectivity

**Authentication Issues**
- Verify JWT_SECRET is set
- Check bootstrap token validity
- Confirm email delivery configuration

**Payment Processing**
- Verify Razorpay credentials
- Check webhook endpoint accessibility
- Confirm webhook secret matches

**Performance Issues**
- Monitor database query performance
- Check rate limiting configuration
- Review audit log retention settings

### Support and Documentation
- API documentation: `/docs/api.md`
- Database schema: Run `npm run db:introspect`
- Audit logs: Available via `/dashboard/logs`
- System settings: Configure via `/dashboard/settings`