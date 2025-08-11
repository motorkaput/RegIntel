import { 
  BillingProvider, 
  Customer, 
  Subscription, 
  PaymentMethod, 
  Invoice, 
  InvoiceLineItem, 
  WebhookEvent 
} from './provider';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export class RazorpayProvider implements BillingProvider {
  name = 'Razorpay';
  private keyId: string;
  private keySecret: string;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    
    // Try to get keys from tenant settings first, then environment
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!this.keyId || !this.keySecret) {
      console.warn('Razorpay credentials not configured, some features may not work');
    }
  }

  private async apiRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', data?: any): Promise<any> {
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay API credentials not configured');
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    
    const response = await fetch(`https://api.razorpay.com/v1/${endpoint}`, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Razorpay API error: ${error.error?.description || response.statusText}`);
    }

    return await response.json();
  }

  async createCustomer(params: {
    tenant_id: string;
    email: string;
    name: string;
    metadata?: Record<string, any>;
  }): Promise<Customer> {
    const razorpayCustomer = await this.apiRequest('customers', 'POST', {
      name: params.name,
      email: params.email,
      notes: {
        tenant_id: params.tenant_id,
        ...params.metadata
      }
    });

    return {
      id: razorpayCustomer.id,
      external_id: razorpayCustomer.id,
      email: razorpayCustomer.email,
      name: razorpayCustomer.name,
      metadata: razorpayCustomer.notes
    };
  }

  async getCustomer(external_id: string): Promise<Customer> {
    const razorpayCustomer = await this.apiRequest(`customers/${external_id}`);

    return {
      id: razorpayCustomer.id,
      external_id: razorpayCustomer.id,
      email: razorpayCustomer.email,
      name: razorpayCustomer.name,
      metadata: razorpayCustomer.notes
    };
  }

  async updateCustomer(external_id: string, params: {
    email?: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<Customer> {
    const updateData: any = {};
    if (params.email) updateData.email = params.email;
    if (params.name) updateData.name = params.name;
    if (params.metadata) updateData.notes = params.metadata;

    const razorpayCustomer = await this.apiRequest(`customers/${external_id}`, 'PATCH', updateData);

    return {
      id: razorpayCustomer.id,
      external_id: razorpayCustomer.id,
      email: razorpayCustomer.email,
      name: razorpayCustomer.name,
      metadata: razorpayCustomer.notes
    };
  }

  async createSubscription(params: {
    customer_id: string;
    plan_id: string;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    // Create a Razorpay plan first (if it doesn't exist)
    const planData = await this.createOrGetPlan(params.plan_id);

    const razorpaySubscription = await this.apiRequest('subscriptions', 'POST', {
      plan_id: planData.id,
      customer_id: params.customer_id,
      total_count: 12, // 12 months
      notes: params.metadata
    });

    return {
      id: razorpaySubscription.id,
      external_id: razorpaySubscription.id,
      customer_id: params.customer_id,
      plan_id: params.plan_id,
      status: this.mapSubscriptionStatus(razorpaySubscription.status),
      current_period_start: new Date(razorpaySubscription.current_start * 1000),
      current_period_end: new Date(razorpaySubscription.current_end * 1000),
      metadata: razorpaySubscription.notes
    };
  }

  async getSubscription(external_id: string): Promise<Subscription> {
    const razorpaySubscription = await this.apiRequest(`subscriptions/${external_id}`);

    return {
      id: razorpaySubscription.id,
      external_id: razorpaySubscription.id,
      customer_id: razorpaySubscription.customer_id,
      plan_id: razorpaySubscription.plan_id,
      status: this.mapSubscriptionStatus(razorpaySubscription.status),
      current_period_start: new Date(razorpaySubscription.current_start * 1000),
      current_period_end: new Date(razorpaySubscription.current_end * 1000),
      metadata: razorpaySubscription.notes
    };
  }

  async updateSubscription(external_id: string, params: {
    plan_id?: string;
    status?: string;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    const updateData: any = {};
    
    if (params.plan_id) {
      const planData = await this.createOrGetPlan(params.plan_id);
      updateData.plan_id = planData.id;
    }
    
    if (params.metadata) {
      updateData.notes = params.metadata;
    }

    // Handle status changes
    if (params.status === 'canceled') {
      await this.apiRequest(`subscriptions/${external_id}/cancel`, 'POST', {
        cancel_at_cycle_end: true
      });
    }

    if (Object.keys(updateData).length > 0) {
      await this.apiRequest(`subscriptions/${external_id}`, 'PATCH', updateData);
    }

    return this.getSubscription(external_id);
  }

  async cancelSubscription(external_id: string): Promise<Subscription> {
    await this.apiRequest(`subscriptions/${external_id}/cancel`, 'POST', {
      cancel_at_cycle_end: true
    });

    return this.getSubscription(external_id);
  }

  async createPaymentSession(params: {
    customer_id: string;
    amount?: number;
    currency?: string;
    success_url: string;
    cancel_url: string;
    metadata?: Record<string, any>;
  }): Promise<{ session_url: string; session_id: string }> {
    // Create a Razorpay order for payment
    const order = await this.apiRequest('orders', 'POST', {
      amount: (params.amount || 0) * 100, // Convert to paise
      currency: params.currency || 'INR',
      notes: {
        customer_id: params.customer_id,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
        ...params.metadata
      }
    });

    // For Razorpay, we return a checkout URL that would be handled by their Checkout script
    const session_url = `${params.success_url}?setup_payment=true&order_id=${order.id}&key_id=${this.keyId}`;

    return {
      session_url,
      session_id: order.id
    };
  }

  async getPaymentMethods(customer_id: string): Promise<PaymentMethod[]> {
    try {
      // Razorpay doesn't have a direct API for stored payment methods
      // This would typically be handled through their checkout process
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      return [];
    }
  }

  async createUsageInvoice(params: {
    customer_id: string;
    period_start: Date;
    period_end: Date;
    line_items: InvoiceLineItem[];
    metadata?: Record<string, any>;
  }): Promise<Invoice> {
    // Calculate total amount
    const totalAmount = params.line_items.reduce((sum, item) => sum + item.amount, 0);

    // Create invoice in Razorpay
    const razorpayInvoice = await this.apiRequest('invoices', 'POST', {
      customer_id: params.customer_id,
      type: 'invoice',
      date: Math.floor(Date.now() / 1000),
      invoice_number: `INV-${Date.now()}`,
      line_items: params.line_items.map(item => ({
        name: item.description,
        amount: Math.round(item.amount * 100), // Convert to paise
        currency: 'INR'
      })),
      notes: {
        period_start: params.period_start.toISOString(),
        period_end: params.period_end.toISOString(),
        ...params.metadata
      }
    });

    return {
      id: razorpayInvoice.id,
      external_id: razorpayInvoice.id,
      customer_id: params.customer_id,
      amount: totalAmount,
      currency: razorpayInvoice.currency,
      status: this.mapInvoiceStatus(razorpayInvoice.status),
      period_start: params.period_start,
      period_end: params.period_end,
      line_items: params.line_items,
      metadata: razorpayInvoice.notes
    };
  }

  async getInvoice(external_id: string): Promise<Invoice> {
    const razorpayInvoice = await this.apiRequest(`invoices/${external_id}`);

    return {
      id: razorpayInvoice.id,
      external_id: razorpayInvoice.id,
      customer_id: razorpayInvoice.customer_id,
      amount: razorpayInvoice.amount / 100, // Convert from paise
      currency: razorpayInvoice.currency,
      status: this.mapInvoiceStatus(razorpayInvoice.status),
      period_start: new Date(razorpayInvoice.notes?.period_start || Date.now()),
      period_end: new Date(razorpayInvoice.notes?.period_end || Date.now()),
      line_items: [], // Would need to parse from Razorpay format
      metadata: razorpayInvoice.notes
    };
  }

  async finalizeInvoice(external_id: string): Promise<Invoice> {
    // Issue the invoice in Razorpay
    await this.apiRequest(`invoices/${external_id}/issue`, 'POST');
    return this.getInvoice(external_id);
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    const data = JSON.parse(payload);
    
    return {
      id: data.event || `evt_${Date.now()}`,
      type: data.event,
      data: data.payload,
      created: new Date(data.created_at ? data.created_at * 1000 : Date.now())
    };
  }

  async handleWebhookEvent(event: WebhookEvent): Promise<{
    type: 'customer.created' | 'customer.updated' | 
          'subscription.created' | 'subscription.updated' | 'subscription.canceled' |
          'invoice.created' | 'invoice.finalized' | 'invoice.paid' | 'invoice.payment_failed' |
          'payment.authorized' | 'payment.captured' | 'payment.failed';
    data: any;
  }> {
    // Map Razorpay events to our standardized format
    const eventTypeMap: Record<string, string> = {
      'customer.created': 'customer.created',
      'customer.updated': 'customer.updated',
      'subscription.activated': 'subscription.created',
      'subscription.charged': 'subscription.updated',
      'subscription.cancelled': 'subscription.canceled',
      'invoice.paid': 'invoice.paid',
      'payment.authorized': 'payment.authorized',
      'payment.captured': 'payment.captured',
      'payment.failed': 'payment.failed'
    };

    const normalizedType = eventTypeMap[event.type] || event.type;

    return {
      type: normalizedType as any,
      data: event.data
    };
  }

  private async createOrGetPlan(planId: string): Promise<any> {
    try {
      // Try to get existing plan
      const plans = await this.apiRequest('plans');
      const existingPlan = plans.items?.find((p: any) => p.notes?.plan_id === planId);
      
      if (existingPlan) {
        return existingPlan;
      }

      // Create new plan - this is simplified, in production you'd have proper plan management
      const planConfig = {
        starter: { amount: 0, interval: 1, period: 'monthly' },
        pro: { amount: 9900, interval: 1, period: 'monthly' } // ₹99
      };

      const config = planConfig[planId as keyof typeof planConfig] || planConfig.starter;

      return await this.apiRequest('plans', 'POST', {
        period: config.period,
        interval: config.interval,
        item: {
          name: `${planId} Plan`,
          amount: config.amount,
          currency: 'INR'
        },
        notes: {
          plan_id: planId
        }
      });
    } catch (error) {
      console.error('Failed to create/get plan:', error);
      throw error;
    }
  }

  private mapSubscriptionStatus(razorpayStatus: string): 'active' | 'paused' | 'canceled' | 'past_due' {
    const statusMap: Record<string, 'active' | 'paused' | 'canceled' | 'past_due'> = {
      'active': 'active',
      'paused': 'paused',
      'cancelled': 'canceled',
      'expired': 'canceled',
      'halted': 'past_due'
    };

    return statusMap[razorpayStatus] || 'active';
  }

  private mapInvoiceStatus(razorpayStatus: string): 'draft' | 'open' | 'paid' | 'void' | 'uncollectible' {
    const statusMap: Record<string, 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'> = {
      'draft': 'draft',
      'issued': 'open',
      'paid': 'paid',
      'cancelled': 'void',
      'expired': 'uncollectible'
    };

    return statusMap[razorpayStatus] || 'draft';
  }
}