import { logger } from '@/lib/logging/logger';
import { runBillingForAllTenants } from '@/lib/jobs/billingRun';
import { runDataRetentionJob } from '@/lib/jobs/retention';

// Job registry and scheduler
export interface Job {
  name: string;
  schedule: string; // Cron expression
  handler: () => Promise<void>;
  description: string;
}

export const jobs: Job[] = [
  {
    name: 'billing-run',
    schedule: '0 2 * * *', // Daily at 2 AM
    handler: runBillingForAllTenants,
    description: 'Process billing for all active tenants'
  },
  {
    name: 'data-retention',
    schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
    handler: runDataRetentionJob,
    description: 'Clean up old data based on retention policies'
  },
  {
    name: 'refresh-aggregates',
    schedule: '0 1 * * *', // Daily at 1 AM
    handler: refreshAggregates,
    description: 'Refresh materialized views and analytics aggregates'
  }
];

async function refreshAggregates(): Promise<void> {
  logger.info('Starting aggregate refresh job');
  
  try {
    // Refresh analytics aggregates
    // This is a placeholder - in a real app you might refresh materialized views
    // or update denormalized data for performance
    
    const { prisma } = await import('@/lib/db');
    
    // Example: Update tenant-level metrics
    const tenants = await prisma.tenant.findMany({
      where: { is_active: true },
      select: { id: true }
    });

    for (const tenant of tenants) {
      try {
        // Calculate and cache analytics for faster dashboard loading
        await calculateTenantMetrics(tenant.id);
      } catch (error) {
        logger.error(`Failed to refresh aggregates for tenant ${tenant.id}`, error as Error);
      }
    }
    
    logger.info('Aggregate refresh completed', { tenants_processed: tenants.length });
  } catch (error) {
    logger.error('Aggregate refresh job failed', error as Error);
    throw error;
  }
}

async function calculateTenantMetrics(tenantId: string): Promise<void> {
  const { prisma } = await import('@/lib/db');
  
  // Calculate key metrics for the tenant
  const [
    totalTasks,
    completedTasks,
    activeUsers,
    averageScore
  ] = await Promise.all([
    prisma.task.count({ where: { tenant_id: tenantId } }),
    prisma.task.count({ where: { tenant_id: tenantId, status: 'done' } }),
    prisma.user.count({ where: { tenant_id: tenantId, is_active: true } }),
    prisma.taskScore.aggregate({
      where: { tenant_id: tenantId },
      _avg: { final_score: true }
    })
  ]);

  // Store or cache these metrics
  // In a real implementation, you might store these in a separate metrics table
  // or in Redis for fast access
  
  logger.debug('Calculated tenant metrics', {
    tenantId,
    totalTasks,
    completedTasks,
    activeUsers,
    averageScore: averageScore._avg.final_score
  });
}

// Job runner for manual execution
export async function runJob(jobName: string): Promise<void> {
  const job = jobs.find(j => j.name === jobName);
  
  if (!job) {
    throw new Error(`Job '${jobName}' not found`);
  }

  logger.info(`Running job: ${job.name}`, { description: job.description });
  
  const startTime = Date.now();
  
  try {
    await job.handler();
    const duration = Date.now() - startTime;
    logger.info(`Job completed: ${job.name}`, { duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Job failed: ${job.name}`, error as Error, { duration });
    throw error;
  }
}

// Get job status and next run times
export function getJobStatus(): Array<{
  name: string;
  schedule: string;
  description: string;
  nextRun?: Date;
}> {
  return jobs.map(job => ({
    name: job.name,
    schedule: job.schedule,
    description: job.description,
    // In a real implementation, you'd calculate next run time from the cron expression
    nextRun: undefined
  }));
}

// Health check for jobs system
export async function checkJobsHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  jobs: Array<{
    name: string;
    status: string;
    lastRun?: Date;
    error?: string;
  }>;
}> {
  // In a real implementation, you'd check job execution history
  // and return the health status of the jobs system
  
  return {
    status: 'healthy',
    jobs: jobs.map(job => ({
      name: job.name,
      status: 'ready',
      lastRun: undefined,
      error: undefined
    }))
  };
}