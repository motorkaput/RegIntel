import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { getUsageForPeriod } from './usage';

interface PricingPlan {
  id: string;
  name?: string;
  base: number; // Base monthly fee
  per_ai_token: number;
  per_active_seat: number;
  per_task_eval: number;
  currency?: string;
}

interface RatingContext {
  tenantId: string;
  userId: string;
  role: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_amount: number;
  amount: number;
  metadata?: Record<string, any>;
}

interface RatingResult {
  period_start: Date;
  period_end: Date;
  plan: PricingPlan;
  usage: {
    ai_tokens: number;
    active_seats: number;
    task_evaluated: number;
  };
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

const DEFAULT_PRICING = {
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      base: 0,
      per_ai_token: 0.00002,
      per_active_seat: 2,
      per_task_eval: 0.01,
      currency: 'USD'
    },
    {
      id: 'pro',
      name: 'Professional',
      base: 99,
      per_ai_token: 0.000015,
      per_active_seat: 1.5,
      per_task_eval: 0.008,
      currency: 'USD'
    }
  ]
};

export async function loadPricingForTenant(tenantId: string, context: RatingContext): Promise<{ plans: PricingPlan[] }> {
  try {
    return await withRLS(
      prisma,
      { tenantId: context.tenantId, userId: context.userId, role: context.role },
      async (client) => {
        // First try to get pricing from tenant settings
        const tenantSettings = await client.tenantSettings.findUnique({
          where: { tenant_id: tenantId }
        });

        if (tenantSettings?.pricing_json) {
          try {
            const customPricing = JSON.parse(tenantSettings.pricing_json);
            return customPricing;
          } catch (error) {
            console.error('Failed to parse tenant pricing JSON:', error);
          }
        }

        // Fallback to environment variable
        const envPricing = process.env.BILLING_PRICING_JSON;
        if (envPricing) {
          try {
            return JSON.parse(envPricing);
          } catch (error) {
            console.error('Failed to parse environment pricing JSON:', error);
          }
        }

        // Final fallback to default pricing
        return DEFAULT_PRICING;
      }
    );
  } catch (error) {
    console.error('Failed to load pricing:', error);
    return DEFAULT_PRICING;
  }
}

export async function getCurrentPlanForTenant(tenantId: string, context: RatingContext): Promise<string> {
  try {
    return await withRLS(
      prisma,
      { tenantId: context.tenantId, userId: context.userId, role: context.role },
      async (client) => {
        // Get current subscription
        const subscription = await client.billingSubscription.findFirst({
          where: { 
            tenant_id: tenantId,
            status: { in: ['active', 'past_due'] }
          },
          orderBy: { created_at: 'desc' }
        });

        return subscription?.plan_id || 'starter';
      }
    );
  } catch (error) {
    console.error('Failed to get current plan:', error);
    return 'starter';
  }
}

export async function calculateCharges(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date,
  context: RatingContext,
  planId?: string
): Promise<RatingResult> {
  // Load pricing
  const pricing = await loadPricingForTenant(tenantId, context);
  
  // Get current or specified plan
  const effectivePlanId = planId || await getCurrentPlanForTenant(tenantId, context);
  const plan = pricing.plans.find(p => p.id === effectivePlanId) || pricing.plans[0];

  // Get usage for the period
  const usage = await getUsageForPeriod(tenantId, periodStart, periodEnd, context);

  // Calculate line items
  const line_items: LineItem[] = [];

  // Base subscription fee
  if (plan.base > 0) {
    line_items.push({
      description: `${plan.name || plan.id} Plan (Monthly)`,
      quantity: 1,
      unit_amount: plan.base,
      amount: plan.base,
      metadata: { type: 'base_fee', plan_id: plan.id }
    });
  }

  // AI tokens usage
  if (usage.ai_tokens > 0 && plan.per_ai_token > 0) {
    const amount = Math.round(usage.ai_tokens * plan.per_ai_token * 100) / 100; // Round to 2 decimal places
    line_items.push({
      description: `AI Tokens (${usage.ai_tokens.toLocaleString()} tokens)`,
      quantity: usage.ai_tokens,
      unit_amount: plan.per_ai_token,
      amount,
      metadata: { type: 'ai_tokens', tokens: usage.ai_tokens }
    });
  }

  // Active seats
  if (usage.active_seats > 0 && plan.per_active_seat > 0) {
    const amount = Math.round(usage.active_seats * plan.per_active_seat * 100) / 100;
    line_items.push({
      description: `Active Users (${usage.active_seats} users)`,
      quantity: usage.active_seats,
      unit_amount: plan.per_active_seat,
      amount,
      metadata: { type: 'active_seats', seats: usage.active_seats }
    });
  }

  // Task evaluations
  if (usage.task_evaluated > 0 && plan.per_task_eval > 0) {
    const amount = Math.round(usage.task_evaluated * plan.per_task_eval * 100) / 100;
    line_items.push({
      description: `Task Evaluations (${usage.task_evaluated} evaluations)`,
      quantity: usage.task_evaluated,
      unit_amount: plan.per_task_eval,
      amount,
      metadata: { type: 'task_evaluations', evaluations: usage.task_evaluated }
    });
  }

  // Calculate totals
  const subtotal = Math.round(line_items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const tax = 0; // TODO: Implement tax calculation based on tenant location
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    period_start: periodStart,
    period_end: periodEnd,
    plan,
    usage: {
      ai_tokens: usage.ai_tokens,
      active_seats: usage.active_seats,
      task_evaluated: usage.task_evaluated
    },
    line_items,
    subtotal,
    tax,
    total,
    currency: plan.currency || 'USD'
  };
}

export async function checkUsageLimits(
  tenantId: string,
  context: RatingContext
): Promise<{
  is_over_soft_limit: boolean;
  is_over_hard_limit: boolean;
  current_usage: any;
  limits: any;
  recommendations: string[];
}> {
  try {
    // Get current billing period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current plan and usage
    const planId = await getCurrentPlanForTenant(tenantId, context);
    const usage = await getUsageForPeriod(tenantId, periodStart, periodEnd, context);

    // Define limits based on plan (these would typically come from pricing config)
    const limits = {
      starter: {
        ai_tokens_soft: 100000,
        ai_tokens_hard: 150000,
        active_seats_soft: 5,
        active_seats_hard: 10,
        task_evaluated_soft: 1000,
        task_evaluated_hard: 1500
      },
      pro: {
        ai_tokens_soft: 1000000,
        ai_tokens_hard: 1500000,
        active_seats_soft: 50,
        active_seats_hard: 100,
        task_evaluated_soft: 10000,
        task_evaluated_hard: 15000
      }
    };

    const planLimits = limits[planId as keyof typeof limits] || limits.starter;

    // Check limits
    const is_over_soft_limit = 
      usage.ai_tokens > planLimits.ai_tokens_soft ||
      usage.active_seats > planLimits.active_seats_soft ||
      usage.task_evaluated > planLimits.task_evaluated_soft;

    const is_over_hard_limit = 
      usage.ai_tokens > planLimits.ai_tokens_hard ||
      usage.active_seats > planLimits.active_seats_hard ||
      usage.task_evaluated > planLimits.task_evaluated_hard;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (usage.ai_tokens > planLimits.ai_tokens_soft) {
      recommendations.push('Consider upgrading your plan for higher AI token limits');
    }
    
    if (usage.active_seats > planLimits.active_seats_soft) {
      recommendations.push('You may need additional user seats');
    }
    
    if (usage.task_evaluated > planLimits.task_evaluated_soft) {
      recommendations.push('Upgrade to increase task evaluation limits');
    }

    return {
      is_over_soft_limit,
      is_over_hard_limit,
      current_usage: usage,
      limits: planLimits,
      recommendations
    };

  } catch (error) {
    console.error('Failed to check usage limits:', error);
    return {
      is_over_soft_limit: false,
      is_over_hard_limit: false,
      current_usage: { ai_tokens: 0, active_seats: 0, task_evaluated: 0 },
      limits: {},
      recommendations: []
    };
  }
}