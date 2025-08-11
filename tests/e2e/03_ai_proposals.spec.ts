import { test, expect } from '@playwright/test';
import { TestHelpers, DEMO_USERS } from './utils';

test.describe('AI Proposals Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(DEMO_USERS.orgLeader);
  });

  test('should create organization analysis proposal', async ({ page }) => {
    // Navigate to analysis page
    await page.goto('/dashboard/analysis');
    
    // Check headers and page title
    await helpers.expectHeaderFooter();
    await expect(page.locator('h1')).toContainText('Organization Analysis');
    
    // Click create new analysis
    await page.click('[data-testid="button-create-analysis"]');
    
    // Fill analysis form
    await helpers.fillForm({
      'analysis_title': 'Q4 Capacity Analysis',
      'analysis_description': 'Analyze organizational capacity for Q4 strategic goals',
      'focus_areas': 'engineering,product,sales'
    });
    
    // Submit analysis request
    await page.click('[data-testid="button-submit-analysis"]');
    
    // Wait for AI processing
    await helpers.waitForLoadingToComplete();
    await expect(page.locator('[data-testid="ai-processing"]')).toBeVisible();
    
    // Wait for results
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
    
    // Check analysis results are displayed
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-assessment"]')).toBeVisible();
    
    // Check that proposal was created
    await expect(page.locator('[data-testid="proposal-status"]')).toContainText('proposed');
  });

  test('should review and accept proposal', async ({ page }) => {
    // Go to proposals list
    await page.goto('/dashboard/proposals');
    
    // Find a proposal in 'proposed' status
    await expect(page.locator('[data-testid="proposals-list"]')).toBeVisible();
    
    // Click on first proposal
    await page.click('[data-testid="proposal-item-0"]');
    
    // Open review modal
    await page.click('[data-testid="button-review-proposal"]');
    await helpers.expectModal('[data-testid="review-modal"]');
    
    // Check proposal details
    await expect(page.locator('[data-testid="proposal-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="proposal-metadata"]')).toBeVisible();
    
    // Add review feedback
    await page.fill('[data-testid="review-feedback"]', 'Analysis looks comprehensive. Approved for implementation.');
    
    // Accept proposal
    await page.click('[data-testid="button-accept-proposal"]');
    
    // Wait for status update
    await helpers.waitForLoadingToComplete();
    
    // Modal should close and status should update
    await expect(page.locator('[data-testid="review-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="proposal-status"]')).toContainText('accepted');
    
    // Check audit log was created
    await page.goto('/dashboard/logs');
    await helpers.waitForApiResponse('/api/logs');
    await expect(page.locator('[data-testid="audit-log-proposal-accepted"]')).toBeVisible();
  });

  test('should modify proposal with reason', async ({ page }) => {
    await page.goto('/dashboard/proposals');
    
    // Find proposal to modify
    await page.click('[data-testid="proposal-item-0"]');
    await page.click('[data-testid="button-modify-proposal"]');
    
    // Open modification modal
    await helpers.expectModal('[data-testid="modify-modal"]');
    
    // Make changes to the proposal
    await page.fill('[data-testid="modified-title"]', 'Updated Analysis Title');
    await page.fill('[data-testid="modification-reason"]', 'Need to include additional market analysis for European expansion.');
    
    // Submit modifications
    await page.click('[data-testid="button-submit-modifications"]');
    
    await helpers.waitForLoadingToComplete();
    
    // Check diff viewer shows changes
    await expect(page.locator('[data-testid="diff-viewer"]')).toBeVisible();
    await expect(page.locator('[data-testid="modification-reason-display"]')).toContainText('market analysis');
    
    // Verify audit log for modification
    await page.goto('/dashboard/logs');
    await expect(page.locator('[data-testid="audit-log-proposal-modified"]')).toBeVisible();
  });

  test('should create goal breakdown proposal', async ({ page }) => {
    // Navigate to goals page
    await page.goto('/dashboard/goals');
    
    // Select a goal for breakdown
    await page.click('[data-testid="goal-item-0"]');
    
    // Click breakdown button
    await page.click('[data-testid="button-breakdown-goal"]');
    
    // Fill breakdown parameters
    await helpers.fillForm({
      'breakdown_granularity': 'project',
      'timeline_weeks': '12',
      'team_preferences': 'engineering,product'
    });
    
    // Submit breakdown request
    await page.click('[data-testid="button-submit-breakdown"]');
    
    // Wait for AI processing
    await helpers.waitForLoadingToComplete();
    
    // Check breakdown results
    await expect(page.locator('[data-testid="breakdown-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-recommendations"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeline-breakdown"]')).toBeVisible();
    
    // Verify AI token usage was recorded
    await page.goto('/dashboard/settings/billing');
    await helpers.waitForLoadingToComplete();
    await expect(page.locator('[data-testid="ai-tokens-usage"]')).toBeVisible();
  });

  test('should show AI processing indicators', async ({ page }) => {
    await page.goto('/dashboard/analysis');
    
    // Start new analysis
    await page.click('[data-testid="button-create-analysis"]');
    
    await helpers.fillForm({
      'analysis_title': 'Processing Test',
      'analysis_description': 'Test AI processing indicators'
    });
    
    await page.click('[data-testid="button-submit-analysis"]');
    
    // Check processing states
    await expect(page.locator('[data-testid="ai-processing"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing-spinner"]')).toBeVisible();
    await expect(page.locator('text=AI is analyzing')).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 });
    
    // Processing indicators should be hidden
    await expect(page.locator('[data-testid="ai-processing"]')).not.toBeVisible();
  });

  test('should handle AI service errors gracefully', async ({ page }) => {
    // Mock AI service failure
    await page.route('/api/ai/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'AI service unavailable' })
      });
    });
    
    await page.goto('/dashboard/analysis');
    await page.click('[data-testid="button-create-analysis"]');
    
    await helpers.fillForm({
      'analysis_title': 'Error Test',
      'analysis_description': 'Test error handling'
    });
    
    await page.click('[data-testid="button-submit-analysis"]');
    
    // Should show error state
    await expect(page.locator('[data-testid="ai-error"]')).toBeVisible();
    await expect(page.locator('text=AI service unavailable')).toBeVisible();
    
    // Should provide retry option
    await expect(page.locator('[data-testid="button-retry-analysis"]')).toBeVisible();
  });

  test('should display proposal metadata and confidence', async ({ page }) => {
    await page.goto('/dashboard/proposals');
    
    // Open proposal details
    await page.click('[data-testid="proposal-item-0"]');
    
    // Check metadata display
    await expect(page.locator('[data-testid="ai-tokens-used"]')).toBeVisible();
    await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="processing-time"]')).toBeVisible();
    
    // Check confidence visualization
    await expect(page.locator('[data-testid="confidence-meter"]')).toBeVisible();
    
    // High confidence should show green indicator
    const confidenceElement = page.locator('[data-testid="confidence-score"]');
    const confidenceText = await confidenceElement.textContent();
    const confidence = parseFloat(confidenceText?.match(/[\d.]+/)?.[0] || '0');
    
    if (confidence > 0.8) {
      await expect(page.locator('[data-testid="confidence-indicator"]')).toHaveClass(/green/);
    }
  });

  test('should export proposal data', async ({ page }) => {
    await page.goto('/dashboard/proposals');
    
    // Open proposal
    await page.click('[data-testid="proposal-item-0"]');
    
    // Export as JSON
    const jsonDownload = await helpers.expectDownload(
      '[data-testid="button-export-json"]',
      'proposal.json'
    );
    
    expect(jsonDownload.suggestedFilename()).toContain('.json');
    
    // Export as PDF
    const pdfDownload = await helpers.expectDownload(
      '[data-testid="button-export-pdf"]',
      'proposal.pdf'
    );
    
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
  });

  test('should maintain proposal version history', async ({ page }) => {
    await page.goto('/dashboard/proposals');
    
    // Open proposal
    await page.click('[data-testid="proposal-item-0"]');
    
    // Check version history
    await page.click('[data-testid="button-view-history"]');
    await helpers.expectModal('[data-testid="history-modal"]');
    
    // Should show version timeline
    await expect(page.locator('[data-testid="version-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="version-item-0"]')).toBeVisible();
    
    // Each version should show timestamp and author
    await expect(page.locator('[data-testid="version-timestamp"]')).toBeVisible();
    await expect(page.locator('[data-testid="version-author"]')).toBeVisible();
  });

  test('should filter proposals by status and type', async ({ page }) => {
    await page.goto('/dashboard/proposals');
    
    // Apply status filter
    await page.selectOption('[data-testid="filter-status"]', 'proposed');
    await helpers.waitForLoadingToComplete();
    
    // Check filtered results
    const proposalItems = page.locator('[data-testid^="proposal-item"]');
    await expect(proposalItems.first()).toBeVisible();
    
    // Apply type filter
    await page.selectOption('[data-testid="filter-type"]', 'organization_analysis');
    await helpers.waitForLoadingToComplete();
    
    // Results should be further filtered
    await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible();
    
    // Clear filters
    await page.click('[data-testid="button-clear-filters"]');
    
    // All proposals should be visible again
    await expect(proposalItems).toHaveCount(await proposalItems.count());
  });
});