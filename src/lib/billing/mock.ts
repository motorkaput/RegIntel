import { 
  BillingProvider, 
  Customer, 
  Subscription, 
  PaymentMethod, 
  Invoice, 
  InvoiceLineItem, 
  WebhookEvent 
} from './provider';

export class MockBillingProvider implements BillingProvider {
  name = 'Mock';

  async createCustomer(params: {
    tenant_id: string;
    email: string;
    name: string;
    metadata?: Record<string, any>;
  }): Promise<Customer> {
    return {
      id: `mock_cust_${Date.now()}`,
      external_id: `mock_cust_${Date.now()}`,
      email: params.email,
      name: params.name,
      metadata: params.metadata
    };
  }

  async getCustomer(external_id: string): Promise<Customer> {
    return {
      id: external_id,
      external_id,
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: { tenant_id: 'mock_tenant' }
    };
  }

  async updateCustomer(external_id: string, params: {
    email?: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<Customer> {
    return {
      id: external_id,
      external_id,
      email: params.email || 'test@example.com',
      name: params.name || 'Test Customer',
      metadata: params.metadata
    };
  }

  async createSubscription(params: {
    customer_id: string;
    plan_id: string;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      id: `mock_sub_${Date.now()}`,
      external_id: `mock_sub_${Date.now()}`,
      customer_id: params.customer_id,
      plan_id: params.plan_id,
      status: 'active',
      current_period_start: now,
      current_period_end: nextMonth,
      metadata: params.metadata
    };
  }

  async getSubscription(external_id: string): Promise<Subscription> {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      id: external_id,
      external_id,
      customer_id: 'mock_customer',
      plan_id: 'starter',
      status: 'active',
      current_period_start: now,
      current_period_end: nextMonth,
      metadata: {}
    };
  }

  async updateSubscription(external_id: string, params: {
    plan_id?: string;
    status?: string;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    const subscription = await this.getSubscription(external_id);
    
    return {
      ...subscription,
      plan_id: params.plan_id || subscription.plan_id,
      status: (params.status as any) || subscription.status,
      metadata: { ...subscription.metadata, ...params.metadata }
    };
  }

  async cancelSubscription(external_id: string): Promise<Subscription> {
    const subscription = await this.getSubscription(external_id);
    return {
      ...subscription,
      status: 'canceled'
    };
  }

  async createPaymentSession(params: {
    customer_id: string;
    amount?: number;
    currency?: string;
    success_url: string;
    cancel_url: string;
    metadata?: Record<string, any>;
  }): Promise<{ session_url: string; session_id: string }> {
    const sessionId = `mock_session_${Date.now()}`;
    
    // For mock, redirect to success URL with mock parameters
    const successUrl = new URL(params.success_url);
    successUrl.searchParams.set('session_id', sessionId);
    successUrl.searchParams.set('mock_payment', 'true');

    return {
      session_url: successUrl.toString(),
      session_id: sessionId
    };
  }

  async getPaymentMethods(customer_id: string): Promise<PaymentMethod[]> {
    return [
      {
        id: 'mock_pm_1',
        external_id: 'mock_pm_1',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025,
        is_default: true
      },
      {
        id: 'mock_pm_2',
        external_id: 'mock_pm_2',
        type: 'card',
        last4: '0000',
        brand: 'mastercard',
        exp_month: 6,
        exp_year: 2026,
        is_default: false
      }
    ];
  }

  async createUsageInvoice(params: {
    customer_id: string;
    period_start: Date;
    period_end: Date;
    line_items: InvoiceLineItem[];
    metadata?: Record<string, any>;
  }): Promise<Invoice> {
    const totalAmount = params.line_items.reduce((sum, item) => sum + item.amount, 0);

    return {
      id: `mock_inv_${Date.now()}`,
      external_id: `mock_inv_${Date.now()}`,
      customer_id: params.customer_id,
      amount: totalAmount,
      currency: 'USD',
      status: 'open',
      period_start: params.period_start,
      period_end: params.period_end,
      line_items: params.line_items,
      metadata: params.metadata
    };
  }

  async getInvoice(external_id: string): Promise<Invoice> {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return {
      id: external_id,
      external_id,
      customer_id: 'mock_customer',
      amount: 99.00,
      currency: 'USD',
      status: 'paid',
      period_start: lastMonth,
      period_end: now,
      line_items: [
        {
          id: 'mock_line_1',
          description: 'Pro Plan (Monthly)',
          quantity: 1,
          unit_amount: 99.00,
          amount: 99.00
        }
      ],
      metadata: {}
    };
  }

  async finalizeInvoice(external_id: string): Promise<Invoice> {
    const invoice = await this.getInvoice(external_id);
    return {
      ...invoice,
      status: 'open'
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // For mock, always return true
    return true;
  }

  parseWebhookEvent(payload: string): WebhookEvent {
    try {
      const data = JSON.parse(payload);
      return {
        id: data.id || `mock_evt_${Date.now()}`,
        type: data.type || 'payment.captured',
        data: data.data || {},
        created: new Date(data.created || Date.now())
      };
    } catch (error) {
      // Return a default mock event
      return {
        id: `mock_evt_${Date.now()}`,
        type: 'payment.captured',
        data: {
          payment: {
            id: `mock_pay_${Date.now()}`,
            amount: 9900,
            currency: 'USD',
            status: 'captured'
          }
        },
        created: new Date()
      };
    }
  }

  async handleWebhookEvent(event: WebhookEvent): Promise<{
    type: 'customer.created' | 'customer.updated' | 
          'subscription.created' | 'subscription.updated' | 'subscription.canceled' |
          'invoice.created' | 'invoice.finalized' | 'invoice.paid' | 'invoice.payment_failed' |
          'payment.authorized' | 'payment.captured' | 'payment.failed';
    data: any;
  }> {
    // Mock webhook handling - just pass through the event type
    const normalizedTypes: Record<string, string> = {
      'payment.captured': 'payment.captured',
      'payment.failed': 'payment.failed',
      'subscription.activated': 'subscription.created',
      'subscription.charged': 'subscription.updated',
      'invoice.paid': 'invoice.paid'
    };

    const normalizedType = normalizedTypes[event.type] || 'payment.captured';

    return {
      type: normalizedType as any,
      data: event.data
    };
  }
}