import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';

interface TimeRange {
  from?: Date;
  to?: Date;
}

interface ScoreAggregation {
  avg: number;
  median: number;
  count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  trend: Array<{
    week_start: Date;
    avg: number;
    count: number;
  }>;
}

interface AggregateContext {
  tenantId: string;
  userId: string;
  role: string;
}

export async function getScoresByUser(
  userId: string,
  timeRange: TimeRange,
  context: AggregateContext
): Promise<ScoreAggregation> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Build where clause
      const whereClause: any = {
        tenant_id: context.tenantId,
        final_score: { not: null },
        task: {
          assignees: {
            some: { user_id: userId }
          }
        }
      };
      
      if (timeRange.from || timeRange.to) {
        whereClause.updated_at = {};
        if (timeRange.from) whereClause.updated_at.gte = timeRange.from;
        if (timeRange.to) whereClause.updated_at.lte = timeRange.to;
      }
      
      // Get all scores
      const scores = await client.taskScore.findMany({
        where: whereClause,
        select: {
          final_score: true,
          updated_at: true
        }
      });
      
      return computeAggregation(scores);
    }
  );
}

export async function getScoresByTeam(
  functionId: string,
  timeRange: TimeRange,
  context: AggregateContext
): Promise<ScoreAggregation> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get users in this function
      const functionUsers = await client.user.findMany({
        where: {
          tenant_id: context.tenantId,
          function_id: functionId,
          is_active: true
        },
        select: { id: true }
      });
      
      const userIds = functionUsers.map(u => u.id);
      
      const whereClause: any = {
        tenant_id: context.tenantId,
        final_score: { not: null },
        task: {
          assignees: {
            some: { 
              user_id: { in: userIds }
            }
          }
        }
      };
      
      if (timeRange.from || timeRange.to) {
        whereClause.updated_at = {};
        if (timeRange.from) whereClause.updated_at.gte = timeRange.from;
        if (timeRange.to) whereClause.updated_at.lte = timeRange.to;
      }
      
      const scores = await client.taskScore.findMany({
        where: whereClause,
        select: {
          final_score: true,
          updated_at: true
        }
      });
      
      return computeAggregation(scores);
    }
  );
}

export async function getScoresByProject(
  projectId: string,
  timeRange: TimeRange,
  context: AggregateContext
): Promise<ScoreAggregation> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const whereClause: any = {
        tenant_id: context.tenantId,
        final_score: { not: null },
        task: {
          project_id: projectId
        }
      };
      
      if (timeRange.from || timeRange.to) {
        whereClause.updated_at = {};
        if (timeRange.from) whereClause.updated_at.gte = timeRange.from;
        if (timeRange.to) whereClause.updated_at.lte = timeRange.to;
      }
      
      const scores = await client.taskScore.findMany({
        where: whereClause,
        select: {
          final_score: true,
          updated_at: true
        }
      });
      
      return computeAggregation(scores);
    }
  );
}

export async function getScoresByOrg(
  timeRange: TimeRange,
  context: AggregateContext
): Promise<ScoreAggregation> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const whereClause: any = {
        tenant_id: context.tenantId,
        final_score: { not: null }
      };
      
      if (timeRange.from || timeRange.to) {
        whereClause.updated_at = {};
        if (timeRange.from) whereClause.updated_at.gte = timeRange.from;
        if (timeRange.to) whereClause.updated_at.lte = timeRange.to;
      }
      
      const scores = await client.taskScore.findMany({
        where: whereClause,
        select: {
          final_score: true,
          updated_at: true
        }
      });
      
      return computeAggregation(scores);
    }
  );
}

function computeAggregation(scores: Array<{ final_score: number | null; updated_at: Date }>): ScoreAggregation {
  const validScores = scores
    .filter(s => s.final_score !== null)
    .map(s => s.final_score as number);
  
  if (validScores.length === 0) {
    return {
      avg: 0,
      median: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      trend: []
    };
  }
  
  // Calculate basic stats
  const avg = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  const sorted = [...validScores].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  validScores.forEach(score => {
    distribution[score as keyof typeof distribution]++;
  });
  
  // Calculate weekly trend
  const trend = computeWeeklyTrend(scores.filter(s => s.final_score !== null) as Array<{ final_score: number; updated_at: Date }>);
  
  return {
    avg: Math.round(avg * 100) / 100, // Round to 2 decimal places
    median,
    count: validScores.length,
    distribution,
    trend
  };
}

function computeWeeklyTrend(scores: Array<{ final_score: number; updated_at: Date }>): Array<{ week_start: Date; avg: number; count: number }> {
  if (scores.length === 0) return [];
  
  // Group by week
  const weeklyGroups: Map<string, Array<number>> = new Map();
  
  scores.forEach(score => {
    const date = new Date(score.updated_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString();
    
    if (!weeklyGroups.has(weekKey)) {
      weeklyGroups.set(weekKey, []);
    }
    weeklyGroups.get(weekKey)!.push(score.final_score);
  });
  
  // Calculate weekly averages
  const trend = Array.from(weeklyGroups.entries())
    .map(([weekKey, weekScores]) => ({
      week_start: new Date(weekKey),
      avg: Math.round((weekScores.reduce((sum, score) => sum + score, 0) / weekScores.length) * 100) / 100,
      count: weekScores.length
    }))
    .sort((a, b) => a.week_start.getTime() - b.week_start.getTime());
  
  return trend;
}

export async function getTopRisersAndFallers(
  context: AggregateContext,
  timeRange: TimeRange,
  limit: number = 5
): Promise<{
  risers: Array<{ user_id: string; name: string; score_change: number }>;
  fallers: Array<{ user_id: string; name: string; score_change: number }>;
}> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get score changes per user over the time period
      const userScoreChanges = await client.$queryRaw`
        WITH user_scores AS (
          SELECT 
            u.id as user_id,
            u.first_name,
            u.last_name,
            AVG(CASE 
              WHEN ts.updated_at >= ${timeRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
              THEN ts.final_score::float 
            END) as recent_avg,
            AVG(CASE 
              WHEN ts.updated_at < ${timeRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
              THEN ts.final_score::float 
            END) as previous_avg
          FROM users u
          LEFT JOIN task_assignees ta ON ta.user_id = u.id
          LEFT JOIN task_scores ts ON ts.task_id = ta.task_id
          WHERE u.tenant_id = ${context.tenantId}
            AND u.is_active = true
            AND ts.final_score IS NOT NULL
          GROUP BY u.id, u.first_name, u.last_name
          HAVING COUNT(ts.final_score) >= 3
        )
        SELECT 
          user_id,
          first_name,
          last_name,
          (recent_avg - previous_avg) as score_change
        FROM user_scores
        WHERE recent_avg IS NOT NULL AND previous_avg IS NOT NULL
        ORDER BY score_change DESC
      ` as Array<{ user_id: string; first_name: string; last_name: string; score_change: number }>;
      
      const risers = userScoreChanges
        .filter(u => u.score_change > 0)
        .slice(0, limit)
        .map(u => ({
          user_id: u.user_id,
          name: `${u.first_name} ${u.last_name}`,
          score_change: Math.round(u.score_change * 100) / 100
        }));
      
      const fallers = userScoreChanges
        .filter(u => u.score_change < 0)
        .slice(-limit)
        .reverse()
        .map(u => ({
          user_id: u.user_id,
          name: `${u.first_name} ${u.last_name}`,
          score_change: Math.round(u.score_change * 100) / 100
        }));
      
      return { risers, fallers };
    }
  );
}