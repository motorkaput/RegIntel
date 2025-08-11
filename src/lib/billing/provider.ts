export interface Customer {
  id: string;
  external_id: string;
  email: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  external_id: string;
  customer_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'canceled' | 'past_due';
  current_period_start: Date;
  current_period_end: Date;
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  external_id: string;
  type: string;
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
}

export interface Invoice {
  id: string;
  external_id: string;
  customer_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  period_start: Date;
  period_end: Date;
  line_items: InvoiceLineItem[];
  metadata?: Record<string, any>;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_amount: number;
  amount: number;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: Date;
}

export interface BillingProvider {
  name: string;
  
  // Customer management
  createCustomer(params: {
    tenant_id: string;
    email: string;
    name: string;
    metadata?: Record<string, any>;
  }): Promise<Customer>;
  
  getCustomer(external_id: string): Promise<Customer>;
  
  updateCustomer(external_id: string, params: {
    email?: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<Customer>;

  // Subscription management
  createSubscription(params: {
    customer_id: string;
    plan_id: string;
    metadata?: Record<string, any>;
  }): Promise<Subscription>;
  
  getSubscription(external_id: string): Promise<Subscription>;
  
  updateSubscription(external_id: string, params: {
    plan_id?: string;
    status?: string;
    metadata?: Record<string, any>;
  }): Promise<Subscription>;
  
  cancelSubscription(external_id: string): Promise<Subscription>;

  // Payment methods
  createPaymentSession(params: {
    customer_id: string;
    amount?: number;
    currency?: string;
    success_url: string;
    cancel_url: string;
    metadata?: Record<string, any>;
  }): Promise<{ session_url: string; session_id: string }>;
  
  getPaymentMethods(customer_id: string): Promise<PaymentMethod[]>;

  // Invoice management
  createUsageInvoice(params: {
    customer_id: string;
    period_start: Date;
    period_end: Date;
    line_items: InvoiceLineItem[];
    metadata?: Record<string, any>;
  }): Promise<Invoice>;
  
  getInvoice(external_id: string): Promise<Invoice>;
  
  finalizeInvoice(external_id: string): Promise<Invoice>;

  // Webhook handling
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean;
  
  parseWebhookEvent(payload: string): WebhookEvent;
  
  handleWebhookEvent(event: WebhookEvent): Promise<{
    type: 'customer.created' | 'customer.updated' | 
          'subscription.created' | 'subscription.updated' | 'subscription.canceled' |
          'invoice.created' | 'invoice.finalized' | 'invoice.paid' | 'invoice.payment_failed' |
          'payment.authorized' | 'payment.captured' | 'payment.failed';
    data: any;
  }>;
}

export async function getProvider(tenantId: string): Promise<BillingProvider> {
  // Get tenant settings first
  const { prisma } = await import('@/lib/db');
  
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenant_id: tenantId }
  });
  
  const paymentProvider = tenantSettings?.payment_provider || process.env.PAYMENT_PROVIDER || 'mock';
  
  switch (paymentProvider.toLowerCase()) {
    case 'razorpay':
      const { RazorpayProvider } = await import('./razorpay');
      return new RazorpayProvider(tenantId);
    
    case 'stripe':
      // Future implementation
      throw new Error('Stripe provider not yet implemented');
    
    case 'mock':
    default:
      const { MockBillingProvider } = await import('./mock');
      return new MockBillingProvider();
  }
}