import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';

interface UsageContext {
  tenantId: string;
  userId: string;
  role: string;
}

interface AiTokensUsage {
  tenantId: string;
  amount: number;
  meta?: {
    model?: string;
    operation?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    [key: string]: any;
  };
}

interface ActiveSeatUsage {
  tenantId: string;
  userId: string;
}

interface TaskEvaluatedUsage {
  tenantId: string;
  taskId: string;
  evaluationType?: 'self' | 'review' | 'override';
}

// Daily cache for active seats to avoid duplicate charges
const activeSeatCache = new Map<string, Set<string>>();

function getDayCacheKey(tenantId: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${tenantId}:${today}`;
}

function cleanupOldCache(): void {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];
  
  Array.from(activeSeatCache.keys()).forEach(key => {
    if (key.includes(yesterdayKey)) {
      activeSeatCache.delete(key);
    }
  });
}

export async function recordAiTokens(usage: AiTokensUsage, context?: UsageContext): Promise<void> {
  try {
    // Use system context if not provided (for background operations)
    const effectiveContext = context || {
      tenantId: usage.tenantId,
      userId: 'system',
      role: 'admin'
    };

    await withRLS(
      prisma,
      { 
        tenantId: effectiveContext.tenantId, 
        userId: effectiveContext.userId, 
        role: effectiveContext.role 
      },
      async (client) => {
        // Create usage event
        const usageEvent = await client.usageEvent.create({
          data: {
            tenant_id: usage.tenantId,
            event_type: 'ai_tokens',
            quantity: usage.amount,
            metadata: usage.meta || {},
            occurred_at: new Date(),
            created_at: new Date()
          }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id: usage.tenantId,
          user_id: effectiveContext.userId,
          action: 'CREATE',
          resource_type: 'usage_event',
          resource_id: usageEvent.id,
          old_values: null,
          new_values: {
            event_type: 'ai_tokens',
            quantity: usage.amount,
            model: usage.meta?.model,
            operation: usage.meta?.operation
          },
          metadata: {
            billing_event: true,
            ...usage.meta
          }
        });
      }
    );
  } catch (error) {
    console.error('Failed to record AI tokens usage:', error);
    // Don't throw - billing shouldn't break main functionality
  }
}

export async function recordActiveSeat(usage: ActiveSeatUsage, context?: UsageContext): Promise<void> {
  try {
    // Check if we've already recorded this user today
    cleanupOldCache();
    const cacheKey = getDayCacheKey(usage.tenantId);
    
    if (!activeSeatCache.has(cacheKey)) {
      activeSeatCache.set(cacheKey, new Set());
    }
    
    const todaysUsers = activeSeatCache.get(cacheKey)!;
    
    if (todaysUsers.has(usage.userId)) {
      // Already recorded today, skip
      return;
    }
    
    // Mark as recorded for today
    todaysUsers.add(usage.userId);

    const effectiveContext = context || {
      tenantId: usage.tenantId,
      userId: usage.userId,
      role: 'team_member'
    };

    await withRLS(
      prisma,
      { 
        tenantId: effectiveContext.tenantId, 
        userId: effectiveContext.userId, 
        role: effectiveContext.role 
      },
      async (client) => {
        // Check if we already have a record for this user today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingEvent = await client.usageEvent.findFirst({
          where: {
            tenant_id: usage.tenantId,
            event_type: 'active_seat',
            metadata: {
              path: ['user_id'],
              equals: usage.userId
            },
            occurred_at: {
              gte: today,
              lt: tomorrow
            }
          }
        });

        if (existingEvent) {
          // Already recorded today
          return;
        }

        // Create usage event
        const usageEvent = await client.usageEvent.create({
          data: {
            tenant_id: usage.tenantId,
            event_type: 'active_seat',
            quantity: 1,
            metadata: {
              user_id: usage.userId
            },
            occurred_at: new Date(),
            created_at: new Date()
          }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id: usage.tenantId,
          user_id: effectiveContext.userId,
          action: 'CREATE',
          resource_type: 'usage_event',
          resource_id: usageEvent.id,
          old_values: null,
          new_values: {
            event_type: 'active_seat',
            quantity: 1,
            target_user_id: usage.userId
          },
          metadata: {
            billing_event: true,
            seat_activation: true
          }
        });
      }
    );
  } catch (error) {
    console.error('Failed to record active seat usage:', error);
    // Don't throw - billing shouldn't break main functionality
  }
}

export async function recordTaskEvaluated(usage: TaskEvaluatedUsage, context?: UsageContext): Promise<void> {
  try {
    const effectiveContext = context || {
      tenantId: usage.tenantId,
      userId: 'system',
      role: 'admin'
    };

    await withRLS(
      prisma,
      { 
        tenantId: effectiveContext.tenantId, 
        userId: effectiveContext.userId, 
        role: effectiveContext.role 
      },
      async (client) => {
        // Get task details for metadata
        const task = await client.task.findUnique({
          where: { id: usage.taskId, tenant_id: usage.tenantId },
          select: { title: true, project_id: true }
        });

        if (!task) {
          console.warn(`Task ${usage.taskId} not found for evaluation usage tracking`);
          return;
        }

        // Create usage event
        const usageEvent = await client.usageEvent.create({
          data: {
            tenant_id: usage.tenantId,
            event_type: 'task_evaluated',
            quantity: 1,
            metadata: {
              task_id: usage.taskId,
              task_title: task.title,
              project_id: task.project_id,
              evaluation_type: usage.evaluationType || 'unknown'
            },
            occurred_at: new Date(),
            created_at: new Date()
          }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id: usage.tenantId,
          user_id: effectiveContext.userId,
          action: 'CREATE',
          resource_type: 'usage_event',
          resource_id: usageEvent.id,
          old_values: null,
          new_values: {
            event_type: 'task_evaluated',
            quantity: 1,
            task_id: usage.taskId,
            evaluation_type: usage.evaluationType
          },
          metadata: {
            billing_event: true,
            task_evaluation: true
          }
        });
      }
    );
  } catch (error) {
    console.error('Failed to record task evaluated usage:', error);
    // Don't throw - billing shouldn't break main functionality
  }
}

export async function getUsageForPeriod(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date,
  context: UsageContext
): Promise<{
  ai_tokens: number;
  active_seats: number;
  task_evaluated: number;
  details: {
    ai_tokens: Array<{ amount: number; meta: any; occurred_at: Date }>;
    active_seats: Array<{ user_id: string; occurred_at: Date }>;
    task_evaluated: Array<{ task_id: string; evaluation_type: string; occurred_at: Date }>;
  };
}> {
  return await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      // Get all usage events for the period
      const usageEvents = await client.usageEvent.findMany({
        where: {
          tenant_id: tenantId,
          occurred_at: {
            gte: periodStart,
            lte: periodEnd
          }
        },
        orderBy: { occurred_at: 'desc' }
      });

      // Aggregate by type
      let ai_tokens = 0;
      let active_seats = 0;
      let task_evaluated = 0;

      const details = {
        ai_tokens: [] as Array<{ amount: number; meta: any; occurred_at: Date }>,
        active_seats: [] as Array<{ user_id: string; occurred_at: Date }>,
        task_evaluated: [] as Array<{ task_id: string; evaluation_type: string; occurred_at: Date }>
      };

      usageEvents.forEach(event => {
        switch (event.event_type) {
          case 'ai_tokens':
            ai_tokens += event.quantity;
            details.ai_tokens.push({
              amount: event.quantity,
              meta: event.metadata,
              occurred_at: event.occurred_at
            });
            break;
          
          case 'active_seat':
            active_seats += event.quantity;
            details.active_seats.push({
              user_id: event.metadata.user_id,
              occurred_at: event.occurred_at
            });
            break;
          
          case 'task_evaluated':
            task_evaluated += event.quantity;
            details.task_evaluated.push({
              task_id: event.metadata.task_id,
              evaluation_type: event.metadata.evaluation_type,
              occurred_at: event.occurred_at
            });
            break;
        }
      });

      return {
        ai_tokens,
        active_seats,
        task_evaluated,
        details
      };
    }
  );
}