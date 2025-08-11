# Cron Jobs Configuration for PerMeaTe Enterprise

## Overview

PerMeaTe Enterprise requires several scheduled jobs for proper operation:

1. **Billing Run** - Process usage and generate invoices
2. **Data Retention** - Clean up old data according to retention policies  
3. **Aggregate Refresh** - Update analytics caches and materialized views

## Setup Options

### Option 1: System Crontab (VM/Docker Compose)

Add these entries to your system crontab (`crontab -e`):

```bash
# PerMeaTe Enterprise Jobs
# Billing run - daily at 2 AM
0 2 * * * cd /path/to/permeate && npm run job:billing >> /var/log/permeate/billing.log 2>&1

# Data retention - weekly on Sunday at 3 AM  
0 3 * * 0 cd /path/to/permeate && npm run job:retention >> /var/log/permeate/retention.log 2>&1

# Refresh aggregates - daily at 1 AM
0 1 * * * cd /path/to/permeate && npm run job:aggregates >> /var/log/permeate/aggregates.log 2>&1
```

### Option 2: Docker Compose with Cron Container

Add to your `docker-compose.yml`:

```yaml
  cron:
    image: your-registry/permeate-enterprise:latest
    command: ["node", "scripts/cron-runner.js"]
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - CRON_MODE=true
    depends_on:
      - postgres
    restart: unless-stopped
```

### Option 3: Kubernetes CronJobs

Apply these CronJob manifests to your cluster:

```yaml
# billing-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: permeate-billing-job
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: billing-job
            image: ghcr.io/your-org/permeate-enterprise:latest
            command: ["npm", "run", "job:billing"]
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: permeate-secrets
                  key: database-url
            # ... other env vars
          restartPolicy: OnFailure
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1

---
# retention-cronjob.yaml  
apiVersion: batch/v1
kind: CronJob
metadata:
  name: permeate-retention-job
spec:
  schedule: "0 3 * * 0"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: retention-job
            image: ghcr.io/your-org/permeate-enterprise:latest
            command: ["npm", "run", "job:retention"]
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: permeate-secrets
                  key: database-url
          restartPolicy: OnFailure
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1

---
# aggregates-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: permeate-aggregates-job
spec:
  schedule: "0 1 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: aggregates-job
            image: ghcr.io/your-org/permeate-enterprise:latest
            command: ["npm", "run", "job:aggregates"]
            env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: permeate-secrets
                  key: database-url
          restartPolicy: OnFailure
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
```

## Job Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "job:billing": "tsx scripts/jobs/billing.ts",
    "job:retention": "tsx scripts/jobs/retention.ts", 
    "job:aggregates": "tsx scripts/jobs/aggregates.ts",
    "job:run": "tsx scripts/jobs/runner.ts"
  }
}
```

## Manual Job Execution

To run jobs manually:

```bash
# Run specific job
npm run job:billing
npm run job:retention
npm run job:aggregates

# Run job via API (if enabled)
curl -X POST http://localhost:3000/api/admin/jobs/billing \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Monitoring Jobs

### Health Checks

Check job health via API:

```bash
curl http://localhost:3000/api/health/jobs
```

### Logs

Jobs write to structured logs. Monitor with:

```bash
# View job logs
tail -f /var/log/permeate/billing.log
tail -f /var/log/permeate/retention.log
tail -f /var/log/permeate/aggregates.log

# In Kubernetes
kubectl logs -f cronjob/permeate-billing-job
kubectl logs -f cronjob/permeate-retention-job
kubectl logs -f cronjob/permeate-aggregates-job
```

### Alerts

Set up alerts for:

- Job failures
- Long-running jobs (>1 hour)
- Missing job executions
- Database connection failures

## Timezone Considerations

All cron schedules use UTC time. Adjust schedules based on your preferred timezone:

```bash
# For PST (UTC-8), run at 10 AM PST = 6 PM UTC
0 18 * * * 

# For EST (UTC-5), run at 10 AM EST = 3 PM UTC  
0 15 * * *
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure the user running cron has proper file permissions
2. **Environment Variables**: Cron doesn't inherit shell environment - set explicitly
3. **Database Connections**: Verify DATABASE_URL is accessible from cron environment
4. **Timezone Issues**: Jobs running at wrong time - check server timezone

### Debug Commands

```bash
# Test database connection
npx prisma db pull

# Verify environment
node -e "console.log(process.env.DATABASE_URL)"

# Test job execution  
NODE_ENV=production npm run job:billing -- --dry-run
```

## Security

- Restrict cron job execution to specific users
- Use least-privilege database connections for jobs
- Rotate secrets regularly
- Monitor job execution logs for anomalies
- Set resource limits for long-running jobs