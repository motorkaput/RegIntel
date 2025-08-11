import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { createAuditLog } from '@/lib/audit';
import { calculateCharges } from '@/lib/billing/rating';
import { getProvider } from '@/lib/billing/provider';

interface BillingRunContext {
  tenantId: string;
  userId: string;
  role: string;
}

export async function runBillingForAllTenants(): Promise<void> {
  console.log('Starting nightly billing run for all tenants...');
  
  try {
    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        is_active: true
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Processing billing for ${tenants.length} tenants`);

    for (const tenant of tenants) {
      try {
        await runBillingForTenant(tenant.id);
      } catch (error) {
        console.error(`Failed to run billing for tenant ${tenant.id}:`, error);
        // Continue with other tenants
      }
    }
    
    console.log('Completed nightly billing run');
    
  } catch (error) {
    console.error('Failed to run nightly billing:', error);
    throw error;
  }
}

export async function runBillingForTenant(tenantId: string): Promise<void> {
  console.log(`Running billing for tenant ${tenantId}...`);

  // Use system context for billing operations
  const context: BillingRunContext = {
    tenantId,
    userId: 'system',
    role: 'admin'
  };

  await withRLS(
    prisma,
    { tenantId: context.tenantId, userId: context.userId, role: context.role },
    async (client) => {
      try {
        // Check if tenant has active subscription
        const subscription = await client.billingSubscription.findFirst({
          where: {
            tenant_id: tenantId,
            status: { in: ['active', 'past_due'] }
          },
          orderBy: { created_at: 'desc' }
        });

        if (!subscription) {
          console.log(`No active subscription found for tenant ${tenantId}, skipping billing`);
          return;
        }

        // Determine billing period
        const now = new Date();
        const periodStart = new Date(subscription.current_period_start);
        const periodEnd = new Date(subscription.current_period_end);

        // Check if we're in the billing period
        if (now < periodEnd) {
          console.log(`Billing period not ended for tenant ${tenantId}, skipping`);
          return;
        }

        // Check if we've already processed this period
        const existingInvoice = await client.billingInvoice.findFirst({
          where: {
            tenant_id: tenantId,
            period_start: periodStart,
            period_end: periodEnd
          }
        });

        if (existingInvoice) {
          console.log(`Invoice already exists for period ${periodStart.toISOString()} - ${periodEnd.toISOString()}`);
          return;
        }

        // Calculate charges for the period
        const charges = await calculateCharges(
          tenantId,
          periodStart,
          periodEnd,
          context,
          subscription.plan_id
        );

        console.log(`Calculated charges for tenant ${tenantId}: $${charges.total}`);

        // Create invoice record in database
        const invoice = await client.billingInvoice.create({
          data: {
            tenant_id: tenantId,
            subscription_id: subscription.id,
            provider: subscription.provider,
            period_start: periodStart,
            period_end: periodEnd,
            subtotal: charges.subtotal,
            tax: charges.tax,
            total: charges.total,
            currency: charges.currency,
            status: 'draft',
            line_items: charges.line_items,
            metadata: {
              plan_id: subscription.plan_id,
              usage: charges.usage,
              generated_by: 'billing_job'
            },
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        // Create invoice with payment provider if configured
        if (subscription.provider !== 'mock') {
          try {
            const provider = await getProvider(tenantId);
            
            const providerInvoice = await provider.createUsageInvoice({
              customer_id: subscription.external_customer_id || '',
              period_start: periodStart,
              period_end: periodEnd,
              line_items: charges.line_items,
              metadata: {
                tenant_id: tenantId,
                internal_invoice_id: invoice.id
              }
            });

            // Update our invoice with external ID
            await client.billingInvoice.update({
              where: { id: invoice.id },
              data: {
                external_id: providerInvoice.external_id,
                status: 'open',
                updated_at: new Date()
              }
            });

            // Finalize the invoice with the provider
            await provider.finalizeInvoice(providerInvoice.external_id);

            console.log(`Created and finalized invoice ${providerInvoice.external_id} with ${subscription.provider}`);

          } catch (providerError) {
            console.error(`Failed to create invoice with provider ${subscription.provider}:`, providerError);
            
            // Update status to indicate provider error
            await client.billingInvoice.update({
              where: { id: invoice.id },
              data: {
                status: 'error',
                metadata: {
                  ...invoice.metadata,
                  provider_error: providerError instanceof Error ? providerError.message : 'Unknown error'
                },
                updated_at: new Date()
              }
            });
          }
        } else {
          // For mock provider, just mark as open
          await client.billingInvoice.update({
            where: { id: invoice.id },
            data: {
              status: 'open',
              external_id: `mock_inv_${invoice.id}`,
              updated_at: new Date()
            }
          });
        }

        // Update subscription period for next billing cycle
        const nextPeriodStart = new Date(periodEnd);
        const nextPeriodEnd = new Date(periodEnd);
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

        await client.billingSubscription.update({
          where: { id: subscription.id },
          data: {
            current_period_start: nextPeriodStart,
            current_period_end: nextPeriodEnd,
            updated_at: new Date()
          }
        });

        // Create audit log
        await createAuditLog(client, {
          tenant_id: tenantId,
          user_id: context.userId,
          action: 'CREATE',
          resource_type: 'billing_invoice',
          resource_id: invoice.id,
          old_values: null,
          new_values: {
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            total: charges.total,
            currency: charges.currency,
            status: 'open'
          },
          metadata: {
            billing_run: true,
            usage_summary: charges.usage,
            line_items_count: charges.line_items.length
          }
        });

        console.log(`Successfully processed billing for tenant ${tenantId}`);

      } catch (error) {
        console.error(`Error processing billing for tenant ${tenantId}:`, error);
        throw error;
      }
    }
  );
}

export async function scheduleBillingRun(): Promise<void> {
  // In a production environment, this would integrate with a job scheduler
  // like node-cron, Bull Queue, or external services like GitHub Actions
  
  console.log('Scheduling nightly billing run...');
  
  // For development, we'll just run immediately
  // In production, this would run on a schedule (e.g., daily at 2 AM)
  try {
    await runBillingForAllTenants();
    console.log('Billing run scheduled and completed successfully');
  } catch (error) {
    console.error('Failed to run scheduled billing:', error);
  }
}

export async function retryFailedInvoices(): Promise<void> {
  console.log('Retrying failed invoices...');
  
  try {
    // Find invoices with error status that are less than 7 days old
    const failedInvoices = await prisma.billingInvoice.findMany({
      where: {
        status: 'error',
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      },
      include: {
        subscription: true
      }
    });

    console.log(`Found ${failedInvoices.length} failed invoices to retry`);

    for (const invoice of failedInvoices) {
      try {
        const provider = await getProvider(invoice.tenant_id);
        
        // Try to create the invoice again
        const providerInvoice = await provider.createUsageInvoice({
          customer_id: invoice.subscription?.external_customer_id || '',
          period_start: invoice.period_start,
          period_end: invoice.period_end,
          line_items: invoice.line_items as any[],
          metadata: {
            tenant_id: invoice.tenant_id,
            internal_invoice_id: invoice.id,
            retry_attempt: true
          }
        });

        // Update the invoice
        await prisma.billingInvoice.update({
          where: { id: invoice.id },
          data: {
            external_id: providerInvoice.external_id,
            status: 'open',
            updated_at: new Date(),
            metadata: {
              ...invoice.metadata,
              retry_successful: true,
              retried_at: new Date().toISOString()
            }
          }
        });

        // Finalize the invoice
        await provider.finalizeInvoice(providerInvoice.external_id);

        console.log(`Successfully retried invoice ${invoice.id}`);

      } catch (error) {
        console.error(`Failed to retry invoice ${invoice.id}:`, error);
        
        // Update metadata with retry failure
        await prisma.billingInvoice.update({
          where: { id: invoice.id },
          data: {
            metadata: {
              ...invoice.metadata,
              retry_failed: true,
              last_retry_error: error instanceof Error ? error.message : 'Unknown error',
              last_retry_at: new Date().toISOString()
            },
            updated_at: new Date()
          }
        });
      }
    }

  } catch (error) {
    console.error('Failed to retry failed invoices:', error);
  }
}