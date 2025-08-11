import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { getProvider } from '@/lib/billing/provider';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';

const subscribeSchema = z.object({
  plan_id: z.string().min(1),
  payment_method_id: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getJWTFromCookies(request);
    if (!authResult.success || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tenant_id, role } = authResult.payload;

    // Check permissions - only admins can manage subscriptions
    if (!['admin', 'org_leader'].includes(role)) {
      return NextResponse.json({ 
        error: 'Only administrators can manage subscriptions' 
      }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const requestValidation = subscribeSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: requestValidation.error.errors 
      }, { status: 400 });
    }

    const { plan_id, payment_method_id, metadata } = requestValidation.data;

    await withRLS(
      prisma,
      { tenantId: tenant_id, userId: user_id, role },
      async (client) => {
        // Get tenant details
        const tenant = await client.tenant.findUnique({
          where: { id: tenant_id },
          select: { name: true }
        });

        if (!tenant) {
          throw new Error('Tenant not found');
        }

        // Get current user for customer creation
        const user = await client.user.findUnique({
          where: { id: user_id },
          select: { email: true, first_name: true, last_name: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Get billing provider
        const provider = await getProvider(tenant_id);

        // Check if customer already exists
        let existingCustomer = await client.billingCustomer.findFirst({
          where: { tenant_id }
        });

        let customer;
        if (existingCustomer) {
          // Get customer from provider
          try {
            customer = await provider.getCustomer(existingCustomer.external_id);
          } catch (error) {
            // Customer doesn't exist in provider, create new one
            customer = await provider.createCustomer({
              tenant_id,
              email: user.email,
              name: `${user.first_name} ${user.last_name}`,
              metadata: { tenant_name: tenant.name }
            });

            // Update our record
            await client.billingCustomer.update({
              where: { id: existingCustomer.id },
              data: { 
                external_id: customer.external_id,
                updated_at: new Date()
              }
            });
          }
        } else {
          // Create new customer
          customer = await provider.createCustomer({
            tenant_id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            metadata: { tenant_name: tenant.name }
          });

          // Store customer in our database
          existingCustomer = await client.billingCustomer.create({
            data: {
              tenant_id,
              external_id: customer.external_id,
              email: customer.email,
              name: customer.name,
              provider: provider.name.toLowerCase(),
              created_at: new Date(),
              updated_at: new Date()
            }
          });
        }

        // Cancel any existing active subscriptions
        const activeSubscriptions = await client.billingSubscription.findMany({
          where: {
            tenant_id,
            status: { in: ['active', 'past_due'] }
          }
        });

        for (const sub of activeSubscriptions) {
          try {
            if (sub.external_id) {
              await provider.cancelSubscription(sub.external_id);
            }
            
            await client.billingSubscription.update({
              where: { id: sub.id },
              data: { 
                status: 'canceled',
                updated_at: new Date()
              }
            });
          } catch (error) {
            console.warn(`Failed to cancel subscription ${sub.id}:`, error);
          }
        }

        // Create new subscription
        const providerSubscription = await provider.createSubscription({
          customer_id: customer.external_id,
          plan_id,
          metadata: {
            tenant_id,
            created_by: user_id,
            ...metadata
          }
        });

        // Store subscription in our database
        const subscription = await client.billingSubscription.create({
          data: {
            tenant_id,
            external_id: providerSubscription.external_id,
            external_customer_id: customer.external_id,
            plan_id,
            status: providerSubscription.status,
            provider: provider.name.toLowerCase(),
            current_period_start: providerSubscription.current_period_start,
            current_period_end: providerSubscription.current_period_end,
            metadata: providerSubscription.metadata || {},
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id,
          user_id,
          action: 'CREATE',
          resource_type: 'billing_subscription',
          resource_id: subscription.id,
          old_values: null,
          new_values: {
            plan_id,
            status: providerSubscription.status,
            provider: provider.name
          },
          metadata: {
            billing_action: true,
            subscription_created: true,
            external_id: providerSubscription.external_id
          }
        });

        return NextResponse.json({
          success: true,
          subscription: {
            id: subscription.id,
            plan_id: subscription.plan_id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end
          },
          customer: {
            id: existingCustomer.id,
            email: existingCustomer.email,
            name: existingCustomer.name
          }
        });
      }
    );

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}