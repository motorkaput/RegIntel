import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/billing/provider';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Get webhook payload and signature
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    
    // Get webhook secret from environment
    const webhookSecret = process.env.BILLING_WEBHOOK_SECRET || 'change-me';
    
    // Verify webhook signature
    const provider = await getProvider('default'); // Use default for webhook verification
    
    if (!provider.verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook event
    const webhookEvent = provider.parseWebhookEvent(body);
    console.log(`Received Razorpay webhook: ${webhookEvent.type}`);

    // Handle the webhook event
    const normalizedEvent = await provider.handleWebhookEvent(webhookEvent);
    
    // Process the normalized event
    await processWebhookEvent(normalizedEvent, webhookEvent.data);

    return NextResponse.json({ 
      received: true,
      event_type: webhookEvent.type 
    });

  } catch (error: any) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processWebhookEvent(event: any, rawData: any): Promise<void> {
  const eventType = event.type;
  const data = event.data;

  switch (eventType) {
    case 'payment.captured':
      await handlePaymentCaptured(data);
      break;
    
    case 'payment.failed':
      await handlePaymentFailed(data);
      break;
    
    case 'subscription.created':
      await handleSubscriptionCreated(data);
      break;
    
    case 'subscription.updated':
      await handleSubscriptionUpdated(data);
      break;
    
    case 'subscription.canceled':
      await handleSubscriptionCanceled(data);
      break;
    
    case 'invoice.paid':
      await handleInvoicePaid(data);
      break;
    
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(data);
      break;
    
    default:
      console.log(`Unhandled webhook event type: ${eventType}`);
  }
}

async function handlePaymentCaptured(data: any): Promise<void> {
  console.log('Processing payment captured event:', data.payment?.id);

  try {
    // Find the related invoice by payment reference
    const paymentId = data.payment?.id;
    if (!paymentId) return;

    // Update any related invoices to paid status
    // This is a simplified implementation - in production you'd have better payment tracking
    const invoices = await prisma.billingInvoice.findMany({
      where: {
        status: 'open',
        // You might store payment_id in metadata when creating the invoice
      },
      take: 1 // Assume one invoice per payment for simplicity
    });

    for (const invoice of invoices) {
      await prisma.billingInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'paid',
          metadata: {
            ...invoice.metadata,
            payment_id: paymentId,
            paid_at: new Date().toISOString()
          },
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(prisma, {
        tenant_id: invoice.tenant_id,
        user_id: 'system',
        action: 'UPDATE',
        resource_type: 'billing_invoice',
        resource_id: invoice.id,
        old_values: { status: 'open' },
        new_values: { status: 'paid' },
        metadata: {
          webhook_event: true,
          payment_captured: true,
          payment_id: paymentId
        }
      });
    }
  } catch (error) {
    console.error('Failed to handle payment captured:', error);
  }
}

async function handlePaymentFailed(data: any): Promise<void> {
  console.log('Processing payment failed event:', data.payment?.id);

  try {
    const paymentId = data.payment?.id;
    if (!paymentId) return;

    // Update related invoices to payment_failed status
    const invoices = await prisma.billingInvoice.findMany({
      where: {
        status: 'open'
      },
      take: 1
    });

    for (const invoice of invoices) {
      await prisma.billingInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'payment_failed',
          metadata: {
            ...invoice.metadata,
            payment_id: paymentId,
            payment_failed_at: new Date().toISOString(),
            failure_reason: data.payment?.error_description
          },
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(prisma, {
        tenant_id: invoice.tenant_id,
        user_id: 'system',
        action: 'UPDATE',
        resource_type: 'billing_invoice',
        resource_id: invoice.id,
        old_values: { status: 'open' },
        new_values: { status: 'payment_failed' },
        metadata: {
          webhook_event: true,
          payment_failed: true,
          payment_id: paymentId,
          failure_reason: data.payment?.error_description
        }
      });
    }
  } catch (error) {
    console.error('Failed to handle payment failed:', error);
  }
}

async function handleSubscriptionCreated(data: any): Promise<void> {
  console.log('Processing subscription created event:', data.subscription?.id);
  // Subscription events are typically handled during the creation process
  // This webhook confirms the creation on the provider side
}

async function handleSubscriptionUpdated(data: any): Promise<void> {
  console.log('Processing subscription updated event:', data.subscription?.id);

  try {
    const subscriptionId = data.subscription?.id;
    if (!subscriptionId) return;

    // Find and update the subscription
    const subscription = await prisma.billingSubscription.findFirst({
      where: { external_id: subscriptionId }
    });

    if (subscription) {
      await prisma.billingSubscription.update({
        where: { id: subscription.id },
        data: {
          status: mapRazorpaySubscriptionStatus(data.subscription?.status),
          metadata: {
            ...subscription.metadata,
            last_webhook_update: new Date().toISOString()
          },
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(prisma, {
        tenant_id: subscription.tenant_id,
        user_id: 'system',
        action: 'UPDATE',
        resource_type: 'billing_subscription',
        resource_id: subscription.id,
        old_values: { status: subscription.status },
        new_values: { status: mapRazorpaySubscriptionStatus(data.subscription?.status) },
        metadata: {
          webhook_event: true,
          subscription_updated: true,
          external_id: subscriptionId
        }
      });
    }
  } catch (error) {
    console.error('Failed to handle subscription updated:', error);
  }
}

async function handleSubscriptionCanceled(data: any): Promise<void> {
  console.log('Processing subscription canceled event:', data.subscription?.id);

  try {
    const subscriptionId = data.subscription?.id;
    if (!subscriptionId) return;

    // Find and update the subscription
    const subscription = await prisma.billingSubscription.findFirst({
      where: { external_id: subscriptionId }
    });

    if (subscription) {
      await prisma.billingSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'canceled',
          metadata: {
            ...subscription.metadata,
            canceled_at: new Date().toISOString(),
            cancellation_reason: 'webhook_notification'
          },
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(prisma, {
        tenant_id: subscription.tenant_id,
        user_id: 'system',
        action: 'UPDATE',
        resource_type: 'billing_subscription',
        resource_id: subscription.id,
        old_values: { status: subscription.status },
        new_values: { status: 'canceled' },
        metadata: {
          webhook_event: true,
          subscription_canceled: true,
          external_id: subscriptionId
        }
      });
    }
  } catch (error) {
    console.error('Failed to handle subscription canceled:', error);
  }
}

async function handleInvoicePaid(data: any): Promise<void> {
  console.log('Processing invoice paid event:', data.invoice?.id);

  try {
    const externalInvoiceId = data.invoice?.id;
    if (!externalInvoiceId) return;

    // Find and update the invoice
    const invoice = await prisma.billingInvoice.findFirst({
      where: { external_id: externalInvoiceId }
    });

    if (invoice) {
      await prisma.billingInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'paid',
          metadata: {
            ...invoice.metadata,
            paid_at: new Date().toISOString(),
            payment_method: data.invoice?.payment_method
          },
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(prisma, {
        tenant_id: invoice.tenant_id,
        user_id: 'system',
        action: 'UPDATE',
        resource_type: 'billing_invoice',
        resource_id: invoice.id,
        old_values: { status: invoice.status },
        new_values: { status: 'paid' },
        metadata: {
          webhook_event: true,
          invoice_paid: true,
          external_id: externalInvoiceId
        }
      });
    }
  } catch (error) {
    console.error('Failed to handle invoice paid:', error);
  }
}

async function handleInvoicePaymentFailed(data: any): Promise<void> {
  console.log('Processing invoice payment failed event:', data.invoice?.id);

  try {
    const externalInvoiceId = data.invoice?.id;
    if (!externalInvoiceId) return;

    // Find and update the invoice
    const invoice = await prisma.billingInvoice.findFirst({
      where: { external_id: externalInvoiceId }
    });

    if (invoice) {
      await prisma.billingInvoice.update({
        where: { id: invoice.id },
        data: {
          status: 'payment_failed',
          metadata: {
            ...invoice.metadata,
            payment_failed_at: new Date().toISOString(),
            failure_reason: data.invoice?.failure_reason
          },
          updated_at: new Date()
        }
      });

      // Create audit log
      await createAuditLog(prisma, {
        tenant_id: invoice.tenant_id,
        user_id: 'system',
        action: 'UPDATE',
        resource_type: 'billing_invoice',
        resource_id: invoice.id,
        old_values: { status: invoice.status },
        new_values: { status: 'payment_failed' },
        metadata: {
          webhook_event: true,
          invoice_payment_failed: true,
          external_id: externalInvoiceId,
          failure_reason: data.invoice?.failure_reason
        }
      });
    }
  } catch (error) {
    console.error('Failed to handle invoice payment failed:', error);
  }
}

function mapRazorpaySubscriptionStatus(razorpayStatus: string): 'active' | 'paused' | 'canceled' | 'past_due' {
  const statusMap: Record<string, 'active' | 'paused' | 'canceled' | 'past_due'> = {
    'active': 'active',
    'paused': 'paused',
    'cancelled': 'canceled',
    'expired': 'canceled',
    'halted': 'past_due'
  };

  return statusMap[razorpayStatus] || 'active';
}