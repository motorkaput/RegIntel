import { prisma } from '@/lib/db';

export async function refreshWeeklyAggregates(): Promise<void> {
  console.log('Starting weekly aggregates refresh...');
  
  try {
    // Create or refresh materialized view for weekly task scores
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW mv_task_scores_weekly AS
      WITH weekly_scores AS (
        SELECT 
          ts.tenant_id,
          'org' as scope_type,
          ts.tenant_id as scope_id,
          DATE_TRUNC('week', ts.updated_at) as week_start,
          AVG(ts.final_score::float) as avg,
          COUNT(ts.final_score) as count,
          COUNT(CASE WHEN ts.final_score = 1 THEN 1 END) as d1,
          COUNT(CASE WHEN ts.final_score = 2 THEN 1 END) as d2,
          COUNT(CASE WHEN ts.final_score = 3 THEN 1 END) as d3,
          COUNT(CASE WHEN ts.final_score = 4 THEN 1 END) as d4,
          COUNT(CASE WHEN ts.final_score = 5 THEN 1 END) as d5
        FROM task_scores ts
        WHERE ts.final_score IS NOT NULL
        GROUP BY ts.tenant_id, DATE_TRUNC('week', ts.updated_at)
        
        UNION ALL
        
        -- Function-level aggregates
        SELECT 
          ts.tenant_id,
          'function' as scope_type,
          u.function_id as scope_id,
          DATE_TRUNC('week', ts.updated_at) as week_start,
          AVG(ts.final_score::float) as avg,
          COUNT(ts.final_score) as count,
          COUNT(CASE WHEN ts.final_score = 1 THEN 1 END) as d1,
          COUNT(CASE WHEN ts.final_score = 2 THEN 1 END) as d2,
          COUNT(CASE WHEN ts.final_score = 3 THEN 1 END) as d3,
          COUNT(CASE WHEN ts.final_score = 4 THEN 1 END) as d4,
          COUNT(CASE WHEN ts.final_score = 5 THEN 1 END) as d5
        FROM task_scores ts
        JOIN tasks t ON t.id = ts.task_id
        JOIN task_assignees ta ON ta.task_id = t.id
        JOIN users u ON u.id = ta.user_id
        WHERE ts.final_score IS NOT NULL
          AND u.function_id IS NOT NULL
        GROUP BY ts.tenant_id, u.function_id, DATE_TRUNC('week', ts.updated_at)
        
        UNION ALL
        
        -- Project-level aggregates
        SELECT 
          ts.tenant_id,
          'project' as scope_type,
          t.project_id as scope_id,
          DATE_TRUNC('week', ts.updated_at) as week_start,
          AVG(ts.final_score::float) as avg,
          COUNT(ts.final_score) as count,
          COUNT(CASE WHEN ts.final_score = 1 THEN 1 END) as d1,
          COUNT(CASE WHEN ts.final_score = 2 THEN 1 END) as d2,
          COUNT(CASE WHEN ts.final_score = 3 THEN 1 END) as d3,
          COUNT(CASE WHEN ts.final_score = 4 THEN 1 END) as d4,
          COUNT(CASE WHEN ts.final_score = 5 THEN 1 END) as d5
        FROM task_scores ts
        JOIN tasks t ON t.id = ts.task_id
        WHERE ts.final_score IS NOT NULL
        GROUP BY ts.tenant_id, t.project_id, DATE_TRUNC('week', ts.updated_at)
        
        UNION ALL
        
        -- User-level aggregates
        SELECT 
          ts.tenant_id,
          'user' as scope_type,
          ta.user_id as scope_id,
          DATE_TRUNC('week', ts.updated_at) as week_start,
          AVG(ts.final_score::float) as avg,
          COUNT(ts.final_score) as count,
          COUNT(CASE WHEN ts.final_score = 1 THEN 1 END) as d1,
          COUNT(CASE WHEN ts.final_score = 2 THEN 1 END) as d2,
          COUNT(CASE WHEN ts.final_score = 3 THEN 1 END) as d3,
          COUNT(CASE WHEN ts.final_score = 4 THEN 1 END) as d4,
          COUNT(CASE WHEN ts.final_score = 5 THEN 1 END) as d5
        FROM task_scores ts
        JOIN tasks t ON t.id = ts.task_id
        JOIN task_assignees ta ON ta.task_id = t.id
        WHERE ts.final_score IS NOT NULL
        GROUP BY ts.tenant_id, ta.user_id, DATE_TRUNC('week', ts.updated_at)
      )
      SELECT * FROM weekly_scores
      ORDER BY tenant_id, scope_type, scope_id, week_start;
    `;

    // Create indexes for performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_task_scores_task_created 
      ON task_scores(task_id, created_at);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_score_iterations_task_created 
      ON score_iterations(task_id, created_at);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_task_scores_tenant_updated 
      ON task_scores(tenant_id, updated_at) 
      WHERE final_score IS NOT NULL;
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_task_scores_final_score 
      ON task_scores(final_score) 
      WHERE final_score IS NOT NULL;
    `;

    console.log('Weekly aggregates refresh completed successfully');
    
  } catch (error) {
    console.error('Error refreshing weekly aggregates:', error);
    throw error;
  }
}

export async function scheduleAggregateRefresh(): Promise<void> {
  // In a production environment, this would integrate with a job scheduler
  // like node-cron, Bull Queue, or external services like GitHub Actions
  
  console.log('Scheduling nightly aggregate refresh...');
  
  // For development, we'll just refresh immediately
  // In production, this would run on a schedule (e.g., daily at 2 AM)
  try {
    await refreshWeeklyAggregates();
    console.log('Aggregate refresh scheduled successfully');
  } catch (error) {
    console.error('Failed to schedule aggregate refresh:', error);
  }
}

// Function to get aggregated data from the materialized view
export async function getWeeklyAggregatesFromView(
  tenantId: string,
  scopeType: string,
  scopeId: string,
  weekStart?: Date,
  weekEnd?: Date
): Promise<any[]> {
  let query = `
    SELECT * FROM mv_task_scores_weekly 
    WHERE tenant_id = $1 AND scope_type = $2 AND scope_id = $3
  `;
  
  const params: any[] = [tenantId, scopeType, scopeId];
  
  if (weekStart) {
    query += ` AND week_start >= $${params.length + 1}`;
    params.push(weekStart);
  }
  
  if (weekEnd) {
    query += ` AND week_start <= $${params.length + 1}`;
    params.push(weekEnd);
  }
  
  query += ` ORDER BY week_start`;
  
  const result = await prisma.$queryRawUnsafe(query, ...params);
  return result as any[];
}