import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';

interface TimeRange {
  from?: Date;
  to?: Date;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface AnalyticsContext {
  tenantId: string;
  userId: string;
  role: string;
}

interface OrgSummary {
  overall_avg_score: number;
  distribution: Record<number, number>;
  weekly_trend: Array<{
    week_start: Date;
    avg_score: number;
    count: number;
  }>;
  top_risks: Array<{
    project_id: string;
    project_name: string;
    risk_score: number;
    blocked_count: number;
  }>;
  improved_projects: Array<{
    project_id: string;
    project_name: string;
    score_change: number;
    trend: 'up' | 'down';
  }>;
  total_tasks: number;
  completed_tasks: number;
  active_projects: number;
  team_size: number;
}

interface FunctionSummary extends Omit<OrgSummary, 'active_projects'> {
  function_id: string;
  function_name: string;
  skills_coverage: Record<string, number>;
  bottlenecks: Array<{
    skill: string;
    demand: number;
    supply: number;
    gap: number;
  }>;
}

interface ProjectSummary {
  project_id: string;
  project_name: string;
  progress_percentage: number;
  blocked_count: number;
  score_distribution: Record<number, number>;
  weekly_trend: Array<{
    week_start: Date;
    avg_score: number;
    count: number;
  }>;
  task_breakdown: {
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
  team_members: Array<{
    user_id: string;
    name: string;
    avg_score: number;
    task_count: number;
  }>;
  recent_activity: Array<{
    task_id: string;
    task_title: string;
    action: string;
    timestamp: Date;
    user_name: string;
  }>;
}

interface UserSummary {
  user_id: string;
  user_name: string;
  avg_score: number;
  score_distribution: Record<number, number>;
  weekly_trend: Array<{
    week_start: Date;
    avg_score: number;
    count: number;
  }>;
  recent_feedback: Array<{
    task_id: string;
    task_title: string;
    score: number;
    feedback: string;
    feedback_type: 'self' | 'review' | 'override';
    timestamp: Date;
  }>;
  task_completion_rate: number;
  skills_improvement: Array<{
    skill: string;
    score_change: number;
    trend: 'up' | 'down';
  }>;
}

// Cache configuration
const CACHE_TTL = 60; // seconds
const cache = new Map<string, { data: any; expires: number; etag: string }>();

function generateCacheKey(prefix: string, params: any): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

function generateETag(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
}

function getCachedData(key: string): { data: any; etag: string } | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return { data: cached.data, etag: cached.etag };
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any): string {
  const etag = generateETag(data);
  cache.set(key, {
    data,
    expires: Date.now() + CACHE_TTL * 1000,
    etag
  });
  return etag;
}

export async function orgSummary(
  timeRange: TimeRange,
  context: AnalyticsContext,
  pagination?: PaginationOptions
): Promise<{ data: OrgSummary; etag: string }> {
  const cacheKey = generateCacheKey('org_summary', { 
    tenantId: context.tenantId,
    from: timeRange.from?.toISOString(),
    to: timeRange.to?.toISOString(),
    page: pagination?.page,
    limit: pagination?.limit
  });

  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Build time filter
      const timeFilter: any = {};
      if (timeRange.from || timeRange.to) {
        timeFilter.updated_at = {};
        if (timeRange.from) timeFilter.updated_at.gte = timeRange.from;
        if (timeRange.to) timeFilter.updated_at.lte = timeRange.to;
      }

      // Get overall scores
      const scores = await client.taskScore.findMany({
        where: {
          tenant_id: context.tenantId,
          final_score: { not: null },
          ...timeFilter
        },
        select: {
          final_score: true,
          updated_at: true,
          task: {
            select: {
              project_id: true,
              status: true,
              project: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      // Calculate overall average
      const validScores = scores.filter(s => s.final_score !== null);
      const overall_avg_score = validScores.length > 0
        ? validScores.reduce((sum, s) => sum + s.final_score!, 0) / validScores.length
        : 0;

      // Calculate distribution
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      validScores.forEach(score => {
        if (score.final_score) {
          distribution[score.final_score]++;
        }
      });

      // Calculate weekly trend
      const weeklyGroups = new Map<string, number[]>();
      validScores.forEach(score => {
        const date = new Date(score.updated_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString();
        
        if (!weeklyGroups.has(weekKey)) {
          weeklyGroups.set(weekKey, []);
        }
        weeklyGroups.get(weekKey)!.push(score.final_score!);
      });

      const weekly_trend = Array.from(weeklyGroups.entries())
        .map(([weekKey, weekScores]) => ({
          week_start: new Date(weekKey),
          avg_score: weekScores.reduce((sum, score) => sum + score, 0) / weekScores.length,
          count: weekScores.length
        }))
        .sort((a, b) => a.week_start.getTime() - b.week_start.getTime());

      // Get project risks (low scores + blocked tasks)
      const projectRisks = await client.$queryRaw`
        SELECT 
          p.id as project_id,
          p.name as project_name,
          AVG(ts.final_score::float) as avg_score,
          COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_count,
          (5 - AVG(ts.final_score::float)) * 2 + COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as risk_score
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN task_scores ts ON ts.task_id = t.id
        WHERE p.tenant_id = ${context.tenantId}
          AND ts.final_score IS NOT NULL
        GROUP BY p.id, p.name
        ORDER BY risk_score DESC
        LIMIT 5
      ` as Array<{
        project_id: string;
        project_name: string;
        avg_score: number;
        blocked_count: bigint;
        risk_score: number;
      }>;

      const top_risks = projectRisks.map(risk => ({
        project_id: risk.project_id,
        project_name: risk.project_name,
        risk_score: Math.round(risk.risk_score * 100) / 100,
        blocked_count: Number(risk.blocked_count)
      }));

      // Get most/least improved projects
      const projectTrends = await client.$queryRaw`
        WITH recent_scores AS (
          SELECT 
            t.project_id,
            p.name as project_name,
            ts.final_score,
            ts.updated_at,
            ROW_NUMBER() OVER (PARTITION BY t.project_id ORDER BY ts.updated_at DESC) as recent_rank,
            ROW_NUMBER() OVER (PARTITION BY t.project_id ORDER BY ts.updated_at ASC) as old_rank
          FROM task_scores ts
          JOIN tasks t ON t.id = ts.task_id
          JOIN projects p ON p.id = t.project_id
          WHERE ts.tenant_id = ${context.tenantId}
            AND ts.final_score IS NOT NULL
            AND ts.updated_at >= NOW() - INTERVAL '30 days'
        ),
        project_changes AS (
          SELECT 
            project_id,
            project_name,
            AVG(CASE WHEN recent_rank <= 5 THEN final_score END) as recent_avg,
            AVG(CASE WHEN old_rank <= 5 THEN final_score END) as old_avg
          FROM recent_scores
          GROUP BY project_id, project_name
          HAVING COUNT(*) >= 10
        )
        SELECT 
          project_id,
          project_name,
          (recent_avg - old_avg) as score_change,
          CASE WHEN recent_avg > old_avg THEN 'up' ELSE 'down' END as trend
        FROM project_changes
        WHERE ABS(recent_avg - old_avg) > 0.1
        ORDER BY ABS(recent_avg - old_avg) DESC
        LIMIT 10
      ` as Array<{
        project_id: string;
        project_name: string;
        score_change: number;
        trend: 'up' | 'down';
      }>;

      // Get basic stats
      const [taskStats, projectCount, teamSize] = await Promise.all([
        client.task.groupBy({
          by: ['status'],
          where: {
            tenant_id: context.tenantId,
            ...timeFilter
          },
          _count: true
        }),
        client.project.count({
          where: { 
            tenant_id: context.tenantId,
            is_active: true 
          }
        }),
        client.user.count({
          where: { 
            tenant_id: context.tenantId,
            is_active: true 
          }
        })
      ]);

      const total_tasks = taskStats.reduce((sum, stat) => sum + stat._count, 0);
      const completed_tasks = taskStats.find(stat => stat.status === 'done')?._count || 0;

      const summary: OrgSummary = {
        overall_avg_score: Math.round(overall_avg_score * 100) / 100,
        distribution,
        weekly_trend,
        top_risks,
        improved_projects: projectTrends.map(trend => ({
          ...trend,
          score_change: Math.round(trend.score_change * 100) / 100
        })),
        total_tasks,
        completed_tasks,
        active_projects: projectCount,
        team_size: teamSize
      };

      return summary;
    }
  );

  const etag = setCachedData(cacheKey, data);
  return { data, etag };
}

export async function functionSummary(
  functionId: string,
  timeRange: TimeRange,
  context: AnalyticsContext,
  pagination?: PaginationOptions
): Promise<{ data: FunctionSummary; etag: string }> {
  const cacheKey = generateCacheKey('function_summary', {
    tenantId: context.tenantId,
    functionId,
    from: timeRange.from?.toISOString(),
    to: timeRange.to?.toISOString(),
    page: pagination?.page,
    limit: pagination?.limit
  });

  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get function details
      const functionDetails = await client.organizationFunction.findUnique({
        where: { id: functionId, tenant_id: context.tenantId }
      });

      if (!functionDetails) {
        throw new Error('Function not found');
      }

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

      // Build time filter
      const timeFilter: any = {};
      if (timeRange.from || timeRange.to) {
        timeFilter.updated_at = {};
        if (timeRange.from) timeFilter.updated_at.gte = timeRange.from;
        if (timeRange.to) timeFilter.updated_at.lte = timeRange.to;
      }

      // Get scores for function users
      const scores = await client.taskScore.findMany({
        where: {
          tenant_id: context.tenantId,
          final_score: { not: null },
          task: {
            assignees: {
              some: {
                user_id: { in: userIds }
              }
            }
          },
          ...timeFilter
        },
        select: {
          final_score: true,
          updated_at: true,
          task: {
            select: {
              project_id: true,
              status: true,
              project: {
                select: { name: true }
              }
            }
          }
        }
      });

      // Reuse org summary logic but scoped to function
      const validScores = scores.filter(s => s.final_score !== null);
      const overall_avg_score = validScores.length > 0
        ? validScores.reduce((sum, s) => sum + s.final_score!, 0) / validScores.length
        : 0;

      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      validScores.forEach(score => {
        if (score.final_score) {
          distribution[score.final_score]++;
        }
      });

      // Weekly trend calculation (similar to org)
      const weeklyGroups = new Map<string, number[]>();
      validScores.forEach(score => {
        const date = new Date(score.updated_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString();
        
        if (!weeklyGroups.has(weekKey)) {
          weeklyGroups.set(weekKey, []);
        }
        weeklyGroups.get(weekKey)!.push(score.final_score!);
      });

      const weekly_trend = Array.from(weeklyGroups.entries())
        .map(([weekKey, weekScores]) => ({
          week_start: new Date(weekKey),
          avg_score: weekScores.reduce((sum, score) => sum + score, 0) / weekScores.length,
          count: weekScores.length
        }))
        .sort((a, b) => a.week_start.getTime() - b.week_start.getTime());

      // Get skills coverage for this function
      const skillsData = await client.userSkill.groupBy({
        by: ['skill_name'],
        where: {
          tenant_id: context.tenantId,
          user_id: { in: userIds }
        },
        _count: true
      });

      const skills_coverage: Record<string, number> = {};
      skillsData.forEach(skill => {
        const coverage = (skill._count / userIds.length) * 100;
        skills_coverage[skill.skill_name] = Math.round(coverage);
      });

      // Calculate skill bottlenecks (placeholder logic)
      const bottlenecks = Object.entries(skills_coverage)
        .filter(([_, coverage]) => coverage < 50)
        .map(([skill, coverage]) => ({
          skill,
          demand: 100, // Would calculate from task requirements
          supply: coverage,
          gap: 100 - coverage
        }))
        .slice(0, 5);

      const summary: FunctionSummary = {
        function_id: functionId,
        function_name: functionDetails.name,
        overall_avg_score: Math.round(overall_avg_score * 100) / 100,
        distribution,
        weekly_trend,
        top_risks: [], // Would implement similar to org
        improved_projects: [], // Would implement similar to org
        total_tasks: validScores.length,
        completed_tasks: scores.filter(s => s.task.status === 'done').length,
        team_size: userIds.length,
        skills_coverage,
        bottlenecks
      };

      return summary;
    }
  );

  const etag = setCachedData(cacheKey, data);
  return { data, etag };
}

export async function projectSummary(
  projectId: string,
  timeRange: TimeRange,
  context: AnalyticsContext,
  pagination?: PaginationOptions
): Promise<{ data: ProjectSummary; etag: string }> {
  const cacheKey = generateCacheKey('project_summary', {
    tenantId: context.tenantId,
    projectId,
    from: timeRange.from?.toISOString(),
    to: timeRange.to?.toISOString(),
    page: pagination?.page,
    limit: pagination?.limit
  });

  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get project details
      const project = await client.project.findUnique({
        where: { id: projectId, tenant_id: context.tenantId },
        select: { id: true, name: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Build time filter
      const timeFilter: any = {};
      if (timeRange.from || timeRange.to) {
        timeFilter.updated_at = {};
        if (timeRange.from) timeFilter.updated_at.gte = timeRange.from;
        if (timeRange.to) timeFilter.updated_at.lte = timeRange.to;
      }

      // Get task breakdown by status
      const taskBreakdown = await client.task.groupBy({
        by: ['status'],
        where: {
          tenant_id: context.tenantId,
          project_id: projectId,
          ...timeFilter
        },
        _count: true
      });

      const task_breakdown = {
        todo: taskBreakdown.find(t => t.status === 'todo')?._count || 0,
        in_progress: taskBreakdown.find(t => t.status === 'in_progress')?._count || 0,
        review: taskBreakdown.find(t => t.status === 'review')?._count || 0,
        done: taskBreakdown.find(t => t.status === 'done')?._count || 0
      };

      const total_tasks = Object.values(task_breakdown).reduce((sum, count) => sum + count, 0);
      const progress_percentage = total_tasks > 0 ? Math.round((task_breakdown.done / total_tasks) * 100) : 0;
      const blocked_count = taskBreakdown.find(t => t.status === 'blocked')?._count || 0;

      // Get scores for project
      const scores = await client.taskScore.findMany({
        where: {
          tenant_id: context.tenantId,
          final_score: { not: null },
          task: { project_id: projectId },
          ...timeFilter
        },
        select: {
          final_score: true,
          updated_at: true
        }
      });

      // Score distribution
      const score_distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      scores.forEach(score => {
        if (score.final_score) {
          score_distribution[score.final_score]++;
        }
      });

      // Weekly trend
      const weeklyGroups = new Map<string, number[]>();
      scores.forEach(score => {
        const date = new Date(score.updated_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString();
        
        if (!weeklyGroups.has(weekKey)) {
          weeklyGroups.set(weekKey, []);
        }
        weeklyGroups.get(weekKey)!.push(score.final_score!);
      });

      const weekly_trend = Array.from(weeklyGroups.entries())
        .map(([weekKey, weekScores]) => ({
          week_start: new Date(weekKey),
          avg_score: weekScores.reduce((sum, score) => sum + score, 0) / weekScores.length,
          count: weekScores.length
        }))
        .sort((a, b) => a.week_start.getTime() - b.week_start.getTime());

      // Team members summary
      const team_members = await client.$queryRaw`
        SELECT 
          u.id as user_id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          AVG(ts.final_score::float) as avg_score,
          COUNT(ts.final_score) as task_count
        FROM users u
        JOIN task_assignees ta ON ta.user_id = u.id
        JOIN tasks t ON t.id = ta.task_id
        LEFT JOIN task_scores ts ON ts.task_id = t.id
        WHERE t.tenant_id = ${context.tenantId}
          AND t.project_id = ${projectId}
          AND ts.final_score IS NOT NULL
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY avg_score DESC
      ` as Array<{
        user_id: string;
        name: string;
        avg_score: number;
        task_count: bigint;
      }>;

      // Recent activity
      const recent_activity = await client.$queryRaw`
        SELECT 
          al.resource_id as task_id,
          t.title as task_title,
          al.action,
          al.created_at as timestamp,
          CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM audit_logs al
        JOIN tasks t ON t.id = al.resource_id
        JOIN users u ON u.id = al.user_id
        WHERE al.tenant_id = ${context.tenantId}
          AND al.resource_type = 'task'
          AND t.project_id = ${projectId}
        ORDER BY al.created_at DESC
        LIMIT 10
      ` as Array<{
        task_id: string;
        task_title: string;
        action: string;
        timestamp: Date;
        user_name: string;
      }>;

      const summary: ProjectSummary = {
        project_id: projectId,
        project_name: project.name,
        progress_percentage,
        blocked_count,
        score_distribution,
        weekly_trend,
        task_breakdown,
        team_members: team_members.map(member => ({
          ...member,
          avg_score: Math.round(member.avg_score * 100) / 100,
          task_count: Number(member.task_count)
        })),
        recent_activity
      };

      return summary;
    }
  );

  const etag = setCachedData(cacheKey, data);
  return { data, etag };
}

export async function userSummary(
  userId: string,
  timeRange: TimeRange,
  context: AnalyticsContext,
  pagination?: PaginationOptions
): Promise<{ data: UserSummary; etag: string }> {
  const cacheKey = generateCacheKey('user_summary', {
    tenantId: context.tenantId,
    userId,
    from: timeRange.from?.toISOString(),
    to: timeRange.to?.toISOString(),
    page: pagination?.page,
    limit: pagination?.limit
  });

  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get user details
      const user = await client.user.findUnique({
        where: { id: userId, tenant_id: context.tenantId },
        select: { id: true, first_name: true, last_name: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Build time filter
      const timeFilter: any = {};
      if (timeRange.from || timeRange.to) {
        timeFilter.updated_at = {};
        if (timeRange.from) timeFilter.updated_at.gte = timeRange.from;
        if (timeRange.to) timeFilter.updated_at.lte = timeRange.to;
      }

      // Get user's scores
      const scores = await client.taskScore.findMany({
        where: {
          tenant_id: context.tenantId,
          final_score: { not: null },
          task: {
            assignees: {
              some: { user_id: userId }
            }
          },
          ...timeFilter
        },
        select: {
          final_score: true,
          updated_at: true
        }
      });

      const validScores = scores.filter(s => s.final_score !== null);
      const avg_score = validScores.length > 0
        ? validScores.reduce((sum, s) => sum + s.final_score!, 0) / validScores.length
        : 0;

      // Score distribution
      const score_distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      validScores.forEach(score => {
        if (score.final_score) {
          score_distribution[score.final_score]++;
        }
      });

      // Weekly trend
      const weeklyGroups = new Map<string, number[]>();
      validScores.forEach(score => {
        const date = new Date(score.updated_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString();
        
        if (!weeklyGroups.has(weekKey)) {
          weeklyGroups.set(weekKey, []);
        }
        weeklyGroups.get(weekKey)!.push(score.final_score!);
      });

      const weekly_trend = Array.from(weeklyGroups.entries())
        .map(([weekKey, weekScores]) => ({
          week_start: new Date(weekKey),
          avg_score: weekScores.reduce((sum, score) => sum + score, 0) / weekScores.length,
          count: weekScores.length
        }))
        .sort((a, b) => a.week_start.getTime() - b.week_start.getTime());

      // Recent feedback
      const recent_feedback = await client.$queryRaw`
        SELECT 
          ts.task_id,
          t.title as task_title,
          COALESCE(ts.override_score, ts.review_score, ts.self_score) as score,
          COALESCE(ts.override_rationale, ts.review_rationale, ts.self_rationale) as feedback,
          CASE 
            WHEN ts.override_score IS NOT NULL THEN 'override'
            WHEN ts.review_score IS NOT NULL THEN 'review'
            ELSE 'self'
          END as feedback_type,
          ts.updated_at as timestamp
        FROM task_scores ts
        JOIN tasks t ON t.id = ts.task_id
        WHERE ts.tenant_id = ${context.tenantId}
          AND EXISTS (
            SELECT 1 FROM task_assignees ta 
            WHERE ta.task_id = ts.task_id AND ta.user_id = ${userId}
          )
          AND (ts.self_rationale IS NOT NULL OR ts.review_rationale IS NOT NULL OR ts.override_rationale IS NOT NULL)
        ORDER BY ts.updated_at DESC
        LIMIT 10
      ` as Array<{
        task_id: string;
        task_title: string;
        score: number;
        feedback: string;
        feedback_type: 'self' | 'review' | 'override';
        timestamp: Date;
      }>;

      // Task completion rate
      const taskCompletionData = await client.task.groupBy({
        by: ['status'],
        where: {
          tenant_id: context.tenantId,
          assignees: {
            some: { user_id: userId }
          },
          ...timeFilter
        },
        _count: true
      });

      const totalUserTasks = taskCompletionData.reduce((sum, stat) => sum + stat._count, 0);
      const completedUserTasks = taskCompletionData.find(stat => stat.status === 'done')?._count || 0;
      const task_completion_rate = totalUserTasks > 0 ? Math.round((completedUserTasks / totalUserTasks) * 100) : 0;

      // Skills improvement (placeholder)
      const skills_improvement: Array<{
        skill: string;
        score_change: number;
        trend: 'up' | 'down';
      }> = [];

      const summary: UserSummary = {
        user_id: userId,
        user_name: `${user.first_name} ${user.last_name}`,
        avg_score: Math.round(avg_score * 100) / 100,
        score_distribution,
        weekly_trend,
        recent_feedback: recent_feedback.filter(f => f.feedback && f.feedback.trim()),
        task_completion_rate,
        skills_improvement
      };

      return summary;
    }
  );

  const etag = setCachedData(cacheKey, data);
  return { data, etag };
}

// Cache invalidation
export function invalidateCache(pattern: string): void {
  const keysToDelete = Array.from(cache.keys()).filter(key => key.includes(pattern));
  keysToDelete.forEach(key => cache.delete(key));
}