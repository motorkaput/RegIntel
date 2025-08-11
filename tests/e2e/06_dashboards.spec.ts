import { test, expect } from '@playwright/test';
import { TestHelpers, DEMO_USERS } from './utils';

test.describe('Analytics Dashboards Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(DEMO_USERS.orgLeader);
  });

  test('should load organization dashboard with trend and distribution charts', async ({ page }) => {
    // Navigate to org analytics dashboard
    await page.goto('/dashboard/analytics/org');
    await helpers.expectHeaderFooter();
    
    // Wait for charts to load
    await helpers.waitForCharts();
    
    // Check main dashboard components
    await expect(page.locator('[data-testid="org-dashboard"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Organization Analytics');
    
    // Check trend chart
    await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="trend-chart"] .recharts-line')).toBeVisible();
    
    // Check distribution chart
    await expect(page.locator('[data-testid="distribution-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="distribution-chart"] .recharts-bar')).toBeVisible();
    
    // Check score gauge
    await expect(page.locator('[data-testid="overall-score-gauge"]')).toBeVisible();
    
    // Check summary stats
    await expect(page.locator('[data-testid="total-tasks"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-tasks"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-size"]')).toBeVisible();
  });

  test('should drill down from org to function level', async ({ page }) => {
    await page.goto('/dashboard/analytics/org');
    await helpers.waitForCharts();
    
    // Check breadcrumb navigation
    await expect(page.locator('[data-testid="breadcrumb-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb-current-0"]')).toContainText('Organization');
    
    // Click on a function from the org view
    await page.click('[data-testid="function-engineering"]');
    
    // Should navigate to function analytics
    await helpers.expectNavigation('/dashboard/analytics/function/');
    
    // Check breadcrumb updated
    await expect(page.locator('[data-testid="breadcrumb-item-0"]')).toContainText('Organization');
    await expect(page.locator('[data-testid="breadcrumb-current-1"]')).toContainText('Engineering');
    
    // Check function-specific charts
    await helpers.waitForCharts();
    await expect(page.locator('[data-testid="function-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="skills-coverage-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="bottlenecks-chart"]')).toBeVisible();
  });

  test('should drill down from function to project level', async ({ page }) => {
    // Start from function level
    await page.goto('/dashboard/analytics/function/eng-func-id');
    await helpers.waitForCharts();
    
    // Click on a project
    await page.click('[data-testid="project-dashboard-redesign"]');
    
    // Should navigate to project analytics
    await helpers.expectNavigation('/dashboard/analytics/project/');
    
    // Check breadcrumb chain
    await expect(page.locator('[data-testid="breadcrumb-item-0"]')).toContainText('Organization');
    await expect(page.locator('[data-testid="breadcrumb-item-1"]')).toContainText('Engineering');
    await expect(page.locator('[data-testid="breadcrumb-current-2"]')).toContainText('Dashboard Redesign');
    
    // Check project-specific data
    await helpers.waitForCharts();
    await expect(page.locator('[data-testid="project-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-performance"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-breakdown"]')).toBeVisible();
  });

  test('should drill down from project to task level', async ({ page }) => {
    // Start from project level
    await page.goto('/dashboard/analytics/project/proj-id');
    await helpers.waitForCharts();
    
    // Click on a task
    await page.click('[data-testid="task-dashboard-api"]');
    
    // Should navigate to task analytics
    await helpers.expectNavigation('/dashboard/analytics/user/');
    
    // Check complete breadcrumb chain
    await expect(page.locator('[data-testid="breadcrumb-item-0"]')).toContainText('Organization');
    await expect(page.locator('[data-testid="breadcrumb-item-1"]')).toContainText('Engineering');
    await expect(page.locator('[data-testid="breadcrumb-item-2"]')).toContainText('Dashboard Redesign');
    await expect(page.locator('[data-testid="breadcrumb-current-3"]')).toContainText('Grace Developer');
    
    // Check user-specific analytics
    await helpers.waitForCharts();
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-score-trend"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
  });

  test('should maintain URL filters during drill-down', async ({ page }) => {
    // Start with filtered org view
    await page.goto('/dashboard/analytics/org?from=2024-01-01&to=2024-12-31&view=detailed');
    
    // Verify URL parameters
    helpers.expectUrlParams({
      'from': '2024-01-01',
      'to': '2024-12-31',
      'view': 'detailed'
    });
    
    // Drill down to function
    await page.click('[data-testid="function-engineering"]');
    
    // URL should preserve filters
    helpers.expectUrlParams({
      'from': '2024-01-01',
      'to': '2024-12-31',
      'view': 'detailed'
    });
    
    // Drill down to project
    await page.click('[data-testid="project-dashboard-redesign"]');
    
    // Filters should still be preserved
    helpers.expectUrlParams({
      'from': '2024-01-01',
      'to': '2024-12-31',
      'view': 'detailed'
    });
  });

  test('should export analytics data as CSV', async ({ page }) => {
    await page.goto('/dashboard/analytics/org');
    await helpers.waitForCharts();
    
    // Click export button
    await page.click('[data-testid="button-export-analytics"]');
    await helpers.expectModal('[data-testid="export-modal"]');
    
    // Select CSV format
    await page.selectOption('[data-testid="export-format"]', 'csv');
    
    // Select scope
    await page.selectOption('[data-testid="export-scope"]', 'org');
    
    // Set date range
    await page.fill('[data-testid="export-from-date"]', '2024-01-01');
    await page.fill('[data-testid="export-to-date"]', '2024-12-31');
    
    // Export data
    const download = await helpers.expectDownload(
      '[data-testid="button-confirm-export"]',
      'org_analytics'
    );
    
    expect(download.suggestedFilename()).toContain('org_analytics');
    expect(download.suggestedFilename()).toContain('.csv');
    
    // Check CSV headers by examining download content (if possible)
    // This is a simplified check - in practice you'd download and verify content
  });

  test('should check CSV export headers and content structure', async ({ page }) => {
    await page.goto('/dashboard/analytics/org');
    
    // Test direct API export endpoint
    const response = await page.request.get('/api/analytics/export?scope=org&format=csv');
    expect(response.status()).toBe(200);
    
    const csvContent = await response.text();
    
    // Check CSV has proper headers
    expect(csvContent).toContain('Organization Analytics Export');
    expect(csvContent).toContain('Overall Metrics');
    expect(csvContent).toContain('Score Distribution');
    expect(csvContent).toContain('Weekly Trend');
    
    // Check content structure
    const lines = csvContent.split('\n');
    expect(lines.length).toBeGreaterThan(10); // Should have substantial content
    
    // Check data rows have proper format
    const dataLines = lines.filter(line => line.includes(',') && !line.startsWith('Generated:'));
    expect(dataLines.length).toBeGreaterThan(5);
  });

  test('should filter analytics by date range', async ({ page }) => {
    await page.goto('/dashboard/analytics/org');
    await helpers.waitForCharts();
    
    // Open date range picker
    await page.click('[data-testid="date-range-picker"]');
    
    // Set date range
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-06-30');
    
    // Apply filter
    await page.click('[data-testid="button-apply-date-filter"]');
    
    // Wait for data to reload
    await helpers.waitForApiResponse('/api/analytics/org');
    await helpers.waitForCharts();
    
    // Check that charts updated
    await expect(page.locator('[data-testid="date-range-display"]')).toContainText('Jan 1, 2024 - Jun 30, 2024');
    
    // Check data reflects the filtered period
    await expect(page.locator('[data-testid="filtered-data-indicator"]')).toBeVisible();
  });

  test('should switch between chart and table views', async ({ page }) => {
    await page.goto('/dashboard/analytics/org');
    await helpers.waitForCharts();
    
    // Check chart view is default
    await expect(page.locator('[data-testid="trend-chart"] .recharts-line')).toBeVisible();
    
    // Switch to table view
    await page.click('[data-testid="button-table-view"]');
    
    // Chart should be hidden, table should be visible
    await expect(page.locator('[data-testid="trend-chart"] .recharts-line')).not.toBeVisible();
    await expect(page.locator('[data-testid="trend-table"]')).toBeVisible();
    
    // Check table has proper headers
    await expect(page.locator('[data-testid="table-header-week"]')).toBeVisible();
    await expect(page.locator('[data-testid="table-header-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="table-header-count"]')).toBeVisible();
    
    // Switch back to chart view
    await page.click('[data-testid="button-chart-view"]');
    
    // Chart should be visible again
    await expect(page.locator('[data-testid="trend-chart"] .recharts-line')).toBeVisible();
    await expect(page.locator('[data-testid="trend-table"]')).not.toBeVisible();
  });

  test('should handle analytics loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/analytics/org', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    await page.goto('/dashboard/analytics/org');
    
    // Check loading indicators
    await expect(page.locator('[data-testid="analytics-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-skeleton"]')).toBeVisible();
    
    // Wait for data to load
    await helpers.waitForLoadingToComplete();
    
    // Loading indicators should be hidden
    await expect(page.locator('[data-testid="analytics-loading"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="chart-skeleton"]')).not.toBeVisible();
    
    // Charts should be visible
    await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
  });

  test('should show error states for failed analytics', async ({ page }) => {
    // Mock API failure
    await page.route('/api/analytics/org', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Analytics service unavailable' })
      });
    });
    
    await page.goto('/dashboard/analytics/org');
    
    // Check error state
    await expect(page.locator('[data-testid="analytics-error"]')).toBeVisible();
    await expect(page.locator('text=Analytics service unavailable')).toBeVisible();
    
    // Check retry button
    await expect(page.locator('[data-testid="button-retry-analytics"]')).toBeVisible();
    
    // Click retry
    await page.click('[data-testid="button-retry-analytics"]');
    
    // Should attempt to reload
    await expect(page.locator('[data-testid="analytics-loading"]')).toBeVisible();
  });

  test('should support mobile responsive analytics', async ({ page }) => {
    await helpers.setMobileViewport();
    await page.goto('/dashboard/analytics/org');
    
    // Check mobile layout
    await helpers.expectHeaderFooter();
    
    // Charts should be mobile responsive
    await helpers.waitForCharts();
    await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();
    
    // Mobile-specific navigation
    await expect(page.locator('[data-testid="mobile-analytics-nav"]')).toBeVisible();
    
    // Swipe gestures for chart navigation (if implemented)
    await page.touchscreen.tap(200, 300);
    
    // Drill-down should work on mobile
    await page.click('[data-testid="function-engineering"]');
    await helpers.expectNavigation('/dashboard/analytics/function/');
  });

  test('should cache analytics data and show ETag headers', async ({ page }) => {
    // First request
    const firstResponse = await page.request.get('/api/analytics/org');
    expect(firstResponse.status()).toBe(200);
    
    const etag = firstResponse.headers()['etag'];
    expect(etag).toBeTruthy();
    
    // Second request with If-None-Match header
    const secondResponse = await page.request.get('/api/analytics/org', {
      headers: {
        'If-None-Match': etag
      }
    });
    
    // Should return 304 Not Modified if data hasn't changed
    expect([200, 304]).toContain(secondResponse.status());
    
    // Check cache headers are present
    const cacheControl = firstResponse.headers()['cache-control'];
    expect(cacheControl).toContain('private');
  });

  test('should handle analytics permissions for different roles', async ({ page }) => {
    // Test with team member (limited access)
    await page.click('[data-testid="button-logout"]');
    await helpers.login(DEMO_USERS.teamMember);
    
    // Should only see user-level analytics
    await page.goto('/dashboard/analytics/user/self');
    await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
    
    // Should not be able to access org analytics
    await page.goto('/dashboard/analytics/org');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    
    // Test with project lead (project access)
    await page.click('[data-testid="button-logout"]');
    await helpers.login(DEMO_USERS.projectLead);
    
    // Should see project analytics
    await page.goto('/dashboard/analytics/project/proj-id');
    await expect(page.locator('[data-testid="project-dashboard"]')).toBeVisible();
    
    // Should not see org analytics
    await page.goto('/dashboard/analytics/org');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });
});