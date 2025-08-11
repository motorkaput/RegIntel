import { NextRequest, NextResponse } from 'next/server';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { getProvider } from '@/lib/billing/provider';
import { loadPricingForTenant, checkUsageLimits } from '@/lib/billing/rating';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions - only admins can view billing portal
    if (!['admin', 'org_leader'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only administrators can view billing information' 
      }, { status: 403 });
    }

    const context = {
      tenantId: tenant_id,
      userId: user_id,
      role
    };

    const portal = await withRLS(
      prisma,
      context,
      async (client) => {
        // Get current subscription
        const subscription = await client.billingSubscription.findFirst({
          where: { 
            tenant_id,
            status: { in: ['active', 'past_due', 'canceled'] }
          },
          orderBy: { created_at: 'desc' }
        });

        // Get customer info
        const customer = await client.billingCustomer.findFirst({
          where: { tenant_id }
        });

        // Get recent invoices
        const invoices = await client.billingInvoice.findMany({
          where: { tenant_id },
          orderBy: { created_at: 'desc' },
          take: 10,
          select: {
            id: true,
            external_id: true,
            period_start: true,
            period_end: true,
            total: true,
            currency: true,
            status: true,
            created_at: true
          }
        });

        // Load pricing plans
        const pricing = await loadPricingForTenant(tenant_id, context);

        // Check usage limits
        const limits = await checkUsageLimits(tenant_id, context);

        // Get payment methods if provider supports it
        let paymentMethods = [];
        if (customer) {
          try {
            const provider = await getProvider(tenant_id);
            paymentMethods = await provider.getPaymentMethods(customer.external_id);
          } catch (error) {
            console.warn('Failed to get payment methods:', error);
          }
        }

        // Determine if this is mock mode
        const provider = await getProvider(tenant_id);
        const isMockMode = provider.name === 'Mock';

        return {
          subscription: subscription ? {
            id: subscription.id,
            plan_id: subscription.plan_id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            provider: subscription.provider
          } : null,
          customer: customer ? {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            provider: customer.provider
          } : null,
          pricing: {
            plans: pricing.plans,
            current_plan: subscription?.plan_id || 'starter'
          },
          usage_limits: limits,
          invoices: invoices.map(invoice => ({
            id: invoice.id,
            external_id: invoice.external_id,
            period: {
              start: invoice.period_start,
              end: invoice.period_end
            },
            amount: invoice.total,
            currency: invoice.currency,
            status: invoice.status,
            created_at: invoice.created_at
          })),
          payment_methods: paymentMethods,
          provider_info: {
            name: provider.name,
            is_mock: isMockMode
          },
          metadata: {
            generated_at: new Date().toISOString(),
            tenant_id
          }
        };
      }
    );

    return NextResponse.json(portal);

  } catch (error: any) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to load billing portal' },
      { status: 500 }
    );
  }
}