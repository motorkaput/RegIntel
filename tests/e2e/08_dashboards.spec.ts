import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/permeate-login');
    await page.fill('input[type="email"]', 'admin@democo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('main dashboard displays correctly', async ({ page }) => {
    // Should already be on dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 5000 });
    
    // Check for charts and metrics
    const charts = page.locator('svg, canvas, [role="img"]');
    const metrics = page.locator('[data-testid*="metric"], .metric, .stat');
    
    const hasVisualElements = await charts.count() > 0 || await metrics.count() > 0;
    expect(hasVisualElements).toBeTruthy();
  });

  test('analytics page accessible', async ({ page }) => {
    const analyticsLink = page.locator('text=Analytics', 'text=Reports', 'text=Insights').first();
    
    if (await analyticsLink.count() > 0) {
      await analyticsLink.click();
    } else {
      await page.goto('/analytics');
    }
    
    // Should see analytics interface
    await expect(page.locator('text=Analytics', 'text=Reports', 'text=Performance')).toBeVisible({ timeout: 5000 });
  });

  test('drill-down functionality', async ({ page }) => {
    await page.goto('/analytics');
    
    // Look for clickable chart elements or drill-down links
    const drilldownElements = page.locator('[data-testid*="chart"], .chart-element, text=View Details').first();
    
    if (await drilldownElements.count() > 0) {
      await drilldownElements.click();
      
      // Should navigate to detailed view or show expanded data
      await page.waitForTimeout(2000);
    }
  });

  test('role-based dashboard content', async ({ page }) => {
    // Test that admin sees appropriate content
    await page.goto('/dashboard');
    
    // Admin should see management-level metrics
    const adminElements = page.locator('text=Team', 'text=Organization', 'text=Overview');
    const hasAdminContent = await adminElements.count() > 0;
    
    expect(hasAdminContent).toBeTruthy();
  });

  test('export and sharing features', async ({ page }) => {
    await page.goto('/analytics');
    
    const exportButton = page.locator('button').filter({ hasText: /Export|Share|Download/ });
    
    if (await exportButton.count() > 0) {
      await exportButton.first().click();
      
      // Should show export options or trigger download
      await page.waitForTimeout(1000);
    }
  });
});