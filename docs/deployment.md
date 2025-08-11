# PerMeaTe Enterprise Deployment Guide

## Prerequisites

- Node.js 18+ with npm
- PostgreSQL 14+ database
- Domain with SSL certificate (for production)
- Docker & Docker Compose (recommended)

## Quick Start with Docker

### First Run

1. **Clone and configure**:
```bash
git clone <repository>
cd permeate-enterprise
cp .env.example .env.local
```

2. **Edit environment variables**:
```bash
nano .env.local
# Fill in required values:
# - DATABASE_URL
# - JWT_SECRET (32+ characters)
# - SESSION_SECRET (32+ characters)  
# - BOOTSTRAP_TOKEN
```

3. **Start with Docker Compose**:
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for database to be ready
docker-compose logs postgres

# Run migrations
npm run db:migrate && npm run db:rls

# Optional: Seed demo data
npm run demo:seed

# Start the application
docker-compose up -d app
```

4. **Verify deployment**:
```bash
# Check health
curl http://localhost:3000/api/health/liveness
curl http://localhost:3000/api/health/readiness

# View logs
docker-compose logs app
```

## Production Deployment

### Environment Setup

1. **Copy production template**:
```bash
cp .env.production.local.sample .env.production.local
```

2. **Generate secure secrets**:
```bash
# JWT_SECRET (32+ characters)
openssl rand -base64 32

# SESSION_SECRET (32+ characters) 
openssl rand -base64 32

# BOOTSTRAP_TOKEN
openssl rand -hex 16
```

3. **Configure services**:
- Set up production PostgreSQL database
- Configure Postmark for email delivery
- Set up Razorpay for payments
- Configure S3 for file storage

### Docker Build and Deploy

```bash
# Build production image
docker build -t permeate-enterprise:latest .

# Run with production environment
docker run -d \
  --name permeate-app \
  --env-file .env.production.local \
  -p 3000:3000 \
  permeate-enterprise:latest

# Or use docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

1. **Create namespace**:
```bash
kubectl create namespace permeate
```

2. **Apply secrets**:
```bash
# Copy and edit secret template
cp k8s/secret.yaml.sample k8s/secret.yaml
# Edit k8s/secret.yaml with base64-encoded values

kubectl apply -f k8s/secret.yaml -n permeate
```

3. **Apply configuration**:
```bash
kubectl apply -f k8s/configmap.yaml -n permeate
```

4. **Deploy application**:
```bash
kubectl apply -f k8s/ -n permeate
```

5. **Verify deployment**:
```bash
kubectl get pods -n permeate
kubectl logs -f deployment/permeate-enterprise -n permeate
```

## Development Setup

### Local Development
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

### Production Build
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

## Operations and Maintenance

### Health Monitoring

**Health Endpoints**:
```bash
# Liveness check (basic health)
curl http://localhost:3000/api/health/liveness

# Readiness check (database + environment)
curl http://localhost:3000/api/health/readiness

# Metrics (application metrics)
curl http://localhost:3000/api/health/metrics
```

**Expected Responses**:
- Liveness: `{"ok":true,"time":"2024-01-01T00:00:00.000Z"}`
- Readiness: `{"ok":true,"checks":{"database":"healthy","environment":"configured"}}`
- Metrics: Application counters and gauges

### Scheduled Jobs

Set up automated jobs for:
- **Billing**: Daily at 2 AM - `npm run job:billing`
- **Data Retention**: Weekly - `npm run job:retention`  
- **Aggregates**: Daily at 1 AM - `npm run job:aggregates`

See `scripts/cron.md` for detailed cron setup.

### Security Operations

**Secret Rotation**:
```bash
# Rotate JWT secret
openssl rand -base64 32
# Update JWT_SECRET and restart application

# Rotate bootstrap token
openssl rand -hex 16
# Update BOOTSTRAP_TOKEN in environment
```

**Webhook Security**:
```bash
# Verify webhook endpoints are accessible
curl -X POST https://yourdomain.com/api/billing/webhook/razorpay \
  -H "Content-Type: application/json" \
  -d '{"test":"webhook"}'

# Configure firewall to allow webhook IPs
# Razorpay webhook IPs: Check their documentation
```

### Database Operations

**Backup and Restore**:
```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup  
psql $DATABASE_URL < backup_20240101.sql

# Verify restore
npm run db:introspect
```

**Migration Management**:
```bash
# Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset
```

### Logging and Tracing

**Log Levels**:
- `debug`: Detailed debugging information
- `info`: General application flow  
- `warn`: Warning conditions
- `error`: Error conditions

**Structured Logging**:
```bash
# Set log level
export LOG_LEVEL=info

# Enable OpenTelemetry tracing
export OTEL_EXPORTER_OTLP_ENDPOINT=http://your-otel-collector:4318
```

**Log Redaction**:
- Sensitive fields are automatically redacted
- Email addresses are partially masked
- Secrets and tokens are marked as [REDACTED]

### Performance Tuning

**Database Performance**:
```bash
# Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;

# Analyze table statistics
ANALYZE;
```

**Rate Limiting**:
- Configure `RATE_LIMIT_QPH_DEFAULT` per tenant needs
- Monitor rate limit metrics in logs
- Adjust limits based on usage patterns

### Scaling Considerations

**Horizontal Scaling**:
- Application is stateless and can be replicated
- Use load balancer with session affinity
- Share file uploads via S3 or shared storage

**Database Scaling**:
- Read replicas for analytics queries
- Connection pooling (PgBouncer recommended)
- Regular VACUUM and ANALYZE operations

## Troubleshooting

### Common Issues

**Application Won't Start**:
```bash
# Check environment variables
node -e "console.log(process.env.DATABASE_URL)"

# Verify database connectivity
npx prisma db pull

# Check migrations
npx prisma migrate status
```

**Database Connection Errors**:
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Check PostgreSQL service status: `systemctl status postgresql`
- Ensure network connectivity: `telnet db-host 5432`
- Verify credentials and database exists

**Authentication Issues**:
- Verify JWT_SECRET is set and consistent across instances
- Check bootstrap token validity and usage
- Confirm email delivery configuration (Postmark tokens)
- Verify magic link generation and delivery

**Payment Processing**:
- Verify Razorpay credentials are correct
- Check webhook endpoint accessibility from external networks
- Confirm webhook secret matches configuration
- Test webhook delivery with Razorpay dashboard

**Performance Issues**:
- Monitor database query performance with `pg_stat_statements`
- Check rate limiting configuration and adjust if needed
- Review audit log retention settings to prevent table bloat
- Monitor memory usage and garbage collection

**File Upload Issues**:
- Check `DEV_STORAGE_MODE` setting (local vs s3)
- Verify S3 credentials and bucket permissions
- Ensure upload directory exists and is writable
- Check file size limits and disk space

### Debug Commands

```bash
# Test database connection
npx prisma studio

# Check environment configuration
npm run check:env

# Run health checks
curl -v http://localhost:3000/api/health/readiness

# View application logs
docker-compose logs -f app

# Check job execution
npm run job:billing -- --dry-run
```

### Support and Documentation
- API documentation: See `docs/api.md`
- Database schema: Run `npx prisma studio`
- Audit logs: Available via `/dashboard/logs`
- System settings: Configure via `/dashboard/settings`
- Job monitoring: Check `/api/health/jobs`