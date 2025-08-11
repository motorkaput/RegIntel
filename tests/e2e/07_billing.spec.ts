import { test, expect } from '@playwright/test';
import { TestHelpers, DEMO_USERS } from './utils';

test.describe('Billing Portal Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(DEMO_USERS.admin);
  });

  test('should load billing portal with current plan and usage', async ({ page }) => {
    // Navigate to billing portal
    await page.goto('/dashboard/settings/billing');
    await helpers.expectHeaderFooter();
    
    // Check billing portal components
    await expect(page.locator('[data-testid="billing-portal"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Billing & Usage');
    
    // Check current plan section
    await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-renewal"]')).toBeVisible();
    
    // Check usage meters
    await expect(page.locator('[data-testid="usage-meters"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-tokens-meter"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-seats-meter"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-evaluations-meter"]')).toBeVisible();
    
    // Check invoice list
    await expect(page.locator('[data-testid="invoice-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-header"]')).toBeVisible();
  });

  test('should run usage preview and show cost breakdown', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    
    // Click usage sync button
    await page.click('[data-testid="button-sync-usage"]');
    
    // Wait for usage calculation
    await helpers.waitForApiResponse('/api/billing/usage/sync');
    await helpers.waitForLoadingToComplete();
    
    // Check usage preview modal
    await helpers.expectModal('[data-testid="usage-preview-modal"]');
    
    // Check cost breakdown
    await expect(page.locator('[data-testid="cost-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-item-base"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-item-ai-tokens"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-item-seats"]')).toBeVisible();
    await expect(page.locator('[data-testid="line-item-evaluations"]')).toBeVisible();
    
    // Check totals
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).toBeVisible();
    
    // Check usage details
    await expect(page.locator('[data-testid="usage-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="tokens-used"]')).toBeVisible();
    await expect(page.locator('[data-testid="seats-active"]')).toBeVisible();
    await expect(page.locator('[data-testid="evaluations-count"]')).toBeVisible();
  });

  test('should detect and show mock mode badge', async ({ page }) => {
    // Check if we're in mock mode (no real Razorpay keys)
    await page.goto('/dashboard/settings/billing');
    
    // Look for mock mode indicator
    const mockBadge = page.locator('[data-testid="mock-mode-badge"]');
    
    if (await mockBadge.isVisible()) {
      // Verify mock mode messaging
      await expect(mockBadge).toContainText('Demo Mode');
      await expect(page.locator('[data-testid="mock-mode-warning"]')).toBeVisible();
      await expect(page.locator('text=This is a demonstration environment')).toBeVisible();
      
      // Check mock payment methods
      await expect(page.locator('[data-testid="mock-payment-methods"]')).toBeVisible();
      await expect(page.locator('[data-testid="mock-card-visa"]')).toBeVisible();
      await expect(page.locator('[data-testid="mock-card-mastercard"]')).toBeVisible();
      
      // Mock invoices should be present
      await expect(page.locator('[data-testid="mock-invoice"]')).toBeVisible();
    } else {
      // Real Razorpay mode
      await expect(page.locator('[data-testid="razorpay-mode-badge"]')).toBeVisible();
      await expect(page.locator('text=Live Payment Processing')).toBeVisible();
    }
  });

  test('should handle plan upgrade flow', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    
    // Click upgrade plan
    await page.click('[data-testid="button-upgrade-plan"]');
    await helpers.expectModal('[data-testid="plan-selection-modal"]');
    
    // Check available plans
    await expect(page.locator('[data-testid="plan-starter"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-pro"]')).toBeVisible();
    
    // Check plan details
    await expect(page.locator('[data-testid="plan-features-starter"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-features-pro"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-pricing-pro"]')).toContainText('$99');
    
    // Select Pro plan
    await page.click('[data-testid="select-plan-pro"]');
    
    // Check upgrade confirmation
    await helpers.expectModal('[data-testid="upgrade-confirmation-modal"]');
    await expect(page.locator('[data-testid="upgrade-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-plan-name"]')).toContainText('Professional');
    
    // Confirm upgrade (in mock mode)
    await page.click('[data-testid="button-confirm-upgrade"]');
    
    // Check upgrade result
    if (await page.locator('[data-testid="mock-mode-badge"]').isVisible()) {
      await expect(page.locator('[data-testid="upgrade-success"]')).toBeVisible();
      await expect(page.locator('text=Plan upgraded successfully')).toBeVisible();
    }
  });

  test('should handle payment method management', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    
    // Navigate to payment methods
    await page.click('[data-testid="button-manage-payment-methods"]');
    
    // Check payment methods list
    await expect(page.locator('[data-testid="payment-methods-list"]')).toBeVisible();
    
    // Add new payment method
    await page.click('[data-testid="button-add-payment-method"]');
    
    const isMockMode = await page.locator('[data-testid="mock-mode-badge"]').isVisible();
    
    if (isMockMode) {
      // Mock mode - simple form
      await helpers.expectModal('[data-testid="mock-payment-modal"]');
      await expect(page.locator('[data-testid="mock-payment-form"]')).toBeVisible();
      
      // Fill mock payment details
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="expiry-date"]', '12/25');
      await page.fill('[data-testid="cvv"]', '123');
      
      await page.click('[data-testid="button-save-payment-method"]');
      
      // Check success
      await expect(page.locator('[data-testid="payment-method-added"]')).toBeVisible();
    } else {
      // Real Razorpay mode - would redirect to Razorpay Checkout
      await expect(page.locator('[data-testid="razorpay-checkout"]')).toBeVisible();
    }
  });

  test('should test webhook endpoint in mock mode', async ({ page }) => {
    // Only run if in mock mode
    const response = await page.request.get('/api/billing/portal');
    const portalData = await response.json();
    
    if (portalData.provider_info?.is_mock) {
      // Test webhook endpoint
      const webhookPayload = {
        event: 'payment.captured',
        data: {
          payment: {
            id: 'mock_pay_test_123',
            amount: 9900,
            currency: 'USD',
            status: 'captured'
          }
        }
      };
      
      // Send test webhook
      const webhookResponse = await page.request.post('/api/billing/webhook/razorpay', {
        data: webhookPayload,
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'test-signature'
        }
      });
      
      expect(webhookResponse.status()).toBe(200);
      
      // Check webhook processed
      await page.goto('/dashboard/settings/billing');
      
      // Check invoice state updated
      await expect(page.locator('[data-testid="invoice-paid"]')).toBeVisible();
      
      // Check audit log
      await page.goto('/dashboard/logs');
      await expect(page.locator('[data-testid="webhook-payment-captured"]')).toBeVisible();
    }
  });

  test('should verify invoice state transitions', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    
    // Check initial invoice states
    await expect(page.locator('[data-testid="invoice-list"]')).toBeVisible();
    
    // Find invoice in different states
    const invoiceRows = page.locator('[data-testid^="invoice-row-"]');
    const invoiceCount = await invoiceRows.count();
    
    if (invoiceCount > 0) {
      // Check first invoice details
      await page.click('[data-testid="invoice-row-0"]');
      await helpers.expectModal('[data-testid="invoice-details-modal"]');
      
      // Check invoice information
      await expect(page.locator('[data-testid="invoice-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-amount"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-period"]')).toBeVisible();
      
      // Check line items
      await expect(page.locator('[data-testid="invoice-line-items"]')).toBeVisible();
      
      // Check payment status
      const status = await page.locator('[data-testid="invoice-status"]').textContent();
      
      if (status?.includes('paid')) {
        await expect(page.locator('[data-testid="payment-success-indicator"]')).toBeVisible();
      } else if (status?.includes('open')) {
        await expect(page.locator('[data-testid="payment-pending-indicator"]')).toBeVisible();
      }
    }
  });

  test('should handle billing API errors gracefully', async ({ page }) => {
    // Mock billing API failure
    await page.route('/api/billing/portal', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Billing service unavailable' })
      });
    });
    
    await page.goto('/dashboard/settings/billing');
    
    // Check error state
    await expect(page.locator('[data-testid="billing-error"]')).toBeVisible();
    await expect(page.locator('text=Billing service unavailable')).toBeVisible();
    
    // Check retry button
    await expect(page.locator('[data-testid="button-retry-billing"]')).toBeVisible();
    
    // Check fallback content
    await expect(page.locator('[data-testid="billing-fallback"]')).toBeVisible();
  });

  test('should show usage limit warnings', async ({ page }) => {
    // Mock over-limit usage
    await page.route('/api/billing/portal', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          usage_limits: {
            is_over_soft_limit: true,
            is_over_hard_limit: false,
            current_usage: {
              ai_tokens: 150000,
              active_seats: 6,
              task_evaluated: 1200
            },
            limits: {
              ai_tokens_soft: 100000,
              active_seats_soft: 5,
              task_evaluated_soft: 1000
            },
            recommendations: [
              'Consider upgrading your plan for higher AI token limits',
              'You may need additional user seats'
            ]
          }
        })
      });
    });
    
    await page.goto('/dashboard/settings/billing');
    
    // Check soft limit warnings
    await expect(page.locator('[data-testid="soft-limit-warning"]')).toBeVisible();
    await expect(page.locator('text=Usage limit exceeded')).toBeVisible();
    
    // Check recommendations
    await expect(page.locator('[data-testid="usage-recommendations"]')).toBeVisible();
    await expect(page.locator('text=Consider upgrading your plan')).toBeVisible();
    
    // Check upgrade CTA
    await expect(page.locator('[data-testid="upgrade-cta"]')).toBeVisible();
  });

  test('should handle hard limit restrictions', async ({ page }) => {
    // Mock hard limit reached
    await page.route('/api/billing/portal', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          usage_limits: {
            is_over_soft_limit: true,
            is_over_hard_limit: true,
            recommendations: [
              'Immediate upgrade required to continue service'
            ]
          }
        })
      });
    });
    
    await page.goto('/dashboard/settings/billing');
    
    // Check hard limit modal
    await helpers.expectModal('[data-testid="hard-limit-modal"]');
    await expect(page.locator('[data-testid="hard-limit-warning"]')).toBeVisible();
    await expect(page.locator('text=Service temporarily limited')).toBeVisible();
    
    // Check upgrade requirement
    await expect(page.locator('[data-testid="upgrade-required"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-upgrade-now"]')).toBeVisible();
    
    // Try to access AI features (should be blocked)
    await page.goto('/dashboard/analysis');
    await expect(page.locator('[data-testid="feature-blocked"]')).toBeVisible();
    await expect(page.locator('text=Feature temporarily unavailable')).toBeVisible();
  });

  test('should export billing data', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    
    // Export invoice data
    await page.click('[data-testid="button-export-invoices"]');
    await helpers.expectModal('[data-testid="export-modal"]');
    
    // Select export options
    await page.selectOption('[data-testid="export-format"]', 'csv');
    await page.fill('[data-testid="export-from-date"]', '2024-01-01');
    await page.fill('[data-testid="export-to-date"]', '2024-12-31');
    
    // Export data
    const download = await helpers.expectDownload(
      '[data-testid="button-confirm-export"]',
      'invoices.csv'
    );
    
    expect(download.suggestedFilename()).toContain('invoices');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should handle subscription management', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    
    // Check subscription details
    await expect(page.locator('[data-testid="subscription-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible();
    
    // Manage subscription
    await page.click('[data-testid="button-manage-subscription"]');
    await helpers.expectModal('[data-testid="subscription-modal"]');
    
    // Check management options
    await expect(page.locator('[data-testid="subscription-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-change-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-cancel-subscription"]')).toBeVisible();
    
    // Check cancellation flow
    await page.click('[data-testid="button-cancel-subscription"]');
    await helpers.expectModal('[data-testid="cancellation-modal"]');
    
    // Check cancellation warnings
    await expect(page.locator('[data-testid="cancellation-warning"]')).toBeVisible();
    await expect(page.locator('text=Your data will be retained')).toBeVisible();
    
    // Check cancellation confirmation required
    await expect(page.locator('[data-testid="cancellation-confirmation"]')).toBeVisible();
  });
});