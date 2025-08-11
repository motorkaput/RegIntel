import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const ScoreValueSchema = z.number().int().min(1).max(5);

interface ScoreSubmission {
  task_id: string;
  value: number;
  rationale?: string;
}

interface ScoreContext {
  tenantId: string;
  userId: string;
  role: string;
}

export async function submitSelfScore(
  submission: ScoreSubmission,
  context: ScoreContext
): Promise<void> {
  const { task_id, value, rationale } = submission;
  
  // Validate score value
  const validValue = ScoreValueSchema.parse(value);
  
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Verify user is assigned to this task
      const task = await client.task.findUnique({
        where: { id: task_id, tenant_id: context.tenantId },
        include: { assignees: true }
      });
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      const isAssigned = task.assignees.some(a => a.user_id === context.userId);
      if (!isAssigned) {
        throw new Error('You can only self-score tasks assigned to you');
      }
      
      // Get current score if exists
      const currentScore = await client.taskScore.findUnique({
        where: { task_id_tenant_id: { task_id, tenant_id: context.tenantId } }
      });
      
      // Update or create score
      const scoreData = {
        task_id,
        tenant_id: context.tenantId,
        self_score: validValue,
        self_rationale: rationale,
        self_scored_by: context.userId,
        self_scored_at: new Date(),
        updated_at: new Date()
      };
      
      const updatedScore = await client.taskScore.upsert({
        where: { task_id_tenant_id: { task_id, tenant_id: context.tenantId } },
        update: scoreData,
        create: scoreData
      });
      
      // Record iteration
      await recordIteration(
        task_id,
        context.userId,
        currentScore?.self_score || null,
        validValue,
        rationale,
        'self',
        context
      );
      
      // Compute new final score
      await computeFinalScore(task_id, context);
      
      // Create audit log
      await createAuditLog(client, {
        tenant_id: context.tenantId,
        user_id: context.userId,
        action: currentScore ? 'UPDATE' : 'CREATE',
        resource_type: 'task_score_self',
        resource_id: task_id,
        old_values: currentScore ? { self_score: currentScore.self_score } : null,
        new_values: { self_score: validValue },
        metadata: { rationale }
      });
    }
  );
}

export async function submitLeadReview(
  submission: ScoreSubmission,
  context: ScoreContext
): Promise<void> {
  const { task_id, value, rationale } = submission;
  
  // Validate score value
  const validValue = ScoreValueSchema.parse(value);
  
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Verify user can review this task (project lead or above)
      if (!['project_lead', 'functional_leader', 'org_leader', 'admin'].includes(context.role)) {
        throw new Error('Only project leads and above can submit reviews');
      }
      
      const task = await client.task.findUnique({
        where: { id: task_id, tenant_id: context.tenantId },
        include: { project: true }
      });
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Check if user is project lead for this task's project
      if (context.role === 'project_lead') {
        const isProjectLead = await client.projectMember.findFirst({
          where: {
            project_id: task.project_id,
            user_id: context.userId,
            role: 'lead',
            tenant_id: context.tenantId
          }
        });
        
        if (!isProjectLead) {
          throw new Error('You can only review tasks in projects you lead');
        }
      }
      
      // Get current score
      const currentScore = await client.taskScore.findUnique({
        where: { task_id_tenant_id: { task_id, tenant_id: context.tenantId } }
      });
      
      // Update score
      const scoreData = {
        task_id,
        tenant_id: context.tenantId,
        review_score: validValue,
        review_rationale: rationale,
        reviewed_by: context.userId,
        reviewed_at: new Date(),
        updated_at: new Date()
      };
      
      const updatedScore = await client.taskScore.upsert({
        where: { task_id_tenant_id: { task_id, tenant_id: context.tenantId } },
        update: scoreData,
        create: scoreData
      });
      
      // Record iteration
      await recordIteration(
        task_id,
        context.userId,
        currentScore?.review_score || null,
        validValue,
        rationale,
        'review',
        context
      );
      
      // Compute new final score
      await computeFinalScore(task_id, context);
      
      // Create audit log
      await createAuditLog(client, {
        tenant_id: context.tenantId,
        user_id: context.userId,
        action: currentScore?.review_score ? 'UPDATE' : 'CREATE',
        resource_type: 'task_score_review',
        resource_id: task_id,
        old_values: currentScore ? { review_score: currentScore.review_score } : null,
        new_values: { review_score: validValue },
        metadata: { rationale }
      });
    }
  );
}

export async function overrideFinalScore(
  submission: ScoreSubmission,
  context: ScoreContext
): Promise<void> {
  const { task_id, value, rationale } = submission;
  
  // Validate score value
  const validValue = ScoreValueSchema.parse(value);
  
  if (!rationale) {
    throw new Error('Rationale is required for score overrides');
  }
  
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Verify user can override scores
      if (!['project_lead', 'functional_leader', 'org_leader', 'admin'].includes(context.role)) {
        throw new Error('Only project leads and above can override scores');
      }
      
      const task = await client.task.findUnique({
        where: { id: task_id, tenant_id: context.tenantId },
        include: { project: true }
      });
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Check permissions for project leads
      if (context.role === 'project_lead') {
        const isProjectLead = await client.projectMember.findFirst({
          where: {
            project_id: task.project_id,
            user_id: context.userId,
            role: 'lead',
            tenant_id: context.tenantId
          }
        });
        
        if (!isProjectLead) {
          throw new Error('Project leads can only override scores in projects they lead');
        }
      }
      
      // Get current score
      const currentScore = await client.taskScore.findUnique({
        where: { task_id_tenant_id: { task_id, tenant_id: context.tenantId } }
      });
      
      // Update score with override
      const scoreData = {
        task_id,
        tenant_id: context.tenantId,
        override_score: validValue,
        override_rationale: rationale,
        overridden_by: context.userId,
        overridden_at: new Date(),
        final_score: validValue, // Override becomes final score
        updated_at: new Date()
      };
      
      const updatedScore = await client.taskScore.upsert({
        where: { task_id_tenant_id: { task_id, tenant_id: context.tenantId } },
        update: scoreData,
        create: scoreData
      });
      
      // Record iteration
      await recordIteration(
        task_id,
        context.userId,
        currentScore?.override_score || currentScore?.final_score || null,
        validValue,
        rationale,
        'override',
        context
      );
      
      // Create audit log
      await createAuditLog(client, {
        tenant_id: context.tenantId,
        user_id: context.userId,
        action: 'UPDATE',
        resource_type: 'task_score_override',
        resource_id: task_id,
        old_values: currentScore ? { 
          override_score: currentScore.override_score,
          final_score: currentScore.final_score 
        } : null,
        new_values: { 
          override_score: validValue,
          final_score: validValue 
        },
        metadata: { rationale }
      });
    }
  );
}

export async function computeFinalScore(
  task_id: string,
  context: ScoreContext
): Promise<number | null> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      const score = await client.taskScore.findUnique({
        where: { task_id_tenant_id: { task_id, tenant_id: context.tenantId } }
      });
      
      if (!score) {
        return null;
      }
      
      // Precedence: override > review > self
      let finalScore: number | null = null;
      
      if (score.override_score !== null) {
        finalScore = score.override_score;
      } else if (score.review_score !== null) {
        finalScore = score.review_score;
      } else if (score.self_score !== null) {
        finalScore = score.self_score;
      }
      
      // Update final score in database
      if (finalScore !== null && finalScore !== score.final_score) {
        await client.taskScore.update({
          where: { task_id_tenant_id: { task_id, tenant_id: context.tenantId } },
          data: { final_score: finalScore, updated_at: new Date() }
        });
      }
      
      return finalScore;
    }
  );
}

export async function recordIteration(
  task_id: string,
  actor_user_id: string,
  from_value: number | null,
  to_value: number,
  reason: string | undefined,
  type: 'self' | 'review' | 'override',
  context: ScoreContext
): Promise<void> {
  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      await client.scoreIteration.create({
        data: {
          task_id,
          tenant_id: context.tenantId,
          actor_user_id,
          from_value,
          to_value,
          reason,
          type,
          created_at: new Date()
        }
      });
    }
  );
}

export async function getTaskScoreHistory(
  task_id: string,
  context: ScoreContext
): Promise<any[]> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      return await client.scoreIteration.findMany({
        where: { 
          task_id,
          tenant_id: context.tenantId 
        },
        include: {
          actor: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });
    }
  );
}