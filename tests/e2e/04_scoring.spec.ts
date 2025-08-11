import { test, expect } from '@playwright/test';
import { TestHelpers, DEMO_USERS } from './utils';

test.describe('Task Scoring Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should complete full scoring workflow', async ({ page }) => {
    // Login as team member to submit self score
    await helpers.login(DEMO_USERS.teamMember);
    
    // Navigate to tasks
    await page.goto('/dashboard/tasks');
    await helpers.expectHeaderFooter();
    
    // Open a task
    await page.click('[data-testid="task-item-0"]');
    await expect(page.locator('[data-testid="task-details"]')).toBeVisible();
    
    // Submit self score
    await page.click('[data-testid="button-self-score"]');
    await helpers.expectModal('[data-testid="scoring-modal"]');
    
    // Fill self evaluation
    await page.click('[data-testid="score-4"]'); // Score of 4
    await page.fill('[data-testid="self-rationale"]', 'Completed all requirements and added extra validation. Good performance overall.');
    
    await page.click('[data-testid="button-submit-self-score"]');
    await helpers.waitForLoadingToComplete();
    
    // Check self score is recorded
    await expect(page.locator('[data-testid="self-score-display"]')).toContainText('4');
    await expect(page.locator('[data-testid="scoring-status"]')).toContainText('awaiting review');
    
    // Logout and login as project lead
    await page.click('[data-testid="button-logout"]');
    await helpers.login(DEMO_USERS.projectLead);
    
    // Navigate to task for review
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-item-0"]');
    
    // Submit review score
    await page.click('[data-testid="button-review-score"]');
    await helpers.expectModal('[data-testid="scoring-modal"]');
    
    // Check self score is visible
    await expect(page.locator('[data-testid="previous-self-score"]')).toContainText('4');
    
    // Submit review
    await page.click('[data-testid="score-5"]'); // Score of 5
    await page.fill('[data-testid="review-rationale"]', 'Excellent work with great attention to detail. Exceeded expectations.');
    
    await page.click('[data-testid="button-submit-review-score"]');
    await helpers.waitForLoadingToComplete();
    
    // Check review score is recorded
    await expect(page.locator('[data-testid="review-score-display"]')).toContainText('5');
    await expect(page.locator('[data-testid="final-score-display"]')).toContainText('5');
    await expect(page.locator('[data-testid="scoring-status"]')).toContainText('completed');
  });

  test('should handle score override scenario', async ({ page }) => {
    // Start with a task that already has self and review scores
    await helpers.login(DEMO_USERS.functionalLeader);
    
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-with-scores"]');
    
    // Check existing scores
    await expect(page.locator('[data-testid="self-score-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-score-display"]')).toBeVisible();
    
    // Submit override score
    await page.click('[data-testid="button-override-score"]');
    await helpers.expectModal('[data-testid="scoring-modal"]');
    
    // Check previous scores are shown
    await expect(page.locator('[data-testid="previous-scores-summary"]')).toBeVisible();
    
    // Provide override
    await page.click('[data-testid="score-3"]'); // Lower score
    await page.fill('[data-testid="override-rationale"]', 'After review with stakeholders, score needs adjustment due to missed requirement for accessibility compliance.');
    
    await page.click('[data-testid="button-submit-override"]');
    await helpers.waitForLoadingToComplete();
    
    // Check override is applied
    await expect(page.locator('[data-testid="override-score-display"]')).toContainText('3');
    await expect(page.locator('[data-testid="final-score-display"]')).toContainText('3');
    
    // Check override indicator
    await expect(page.locator('[data-testid="override-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="override-reason"]')).toContainText('accessibility compliance');
  });

  test('should show scoring iteration timeline', async ({ page }) => {
    await helpers.login(DEMO_USERS.projectLead);
    
    // Open task with multiple score iterations
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-with-iterations"]');
    
    // Open scoring history
    await page.click('[data-testid="button-view-scoring-history"]');
    await helpers.expectModal('[data-testid="scoring-history-modal"]');
    
    // Check timeline shows all iterations
    await expect(page.locator('[data-testid="iteration-timeline"]')).toBeVisible();
    
    // Check each iteration
    await expect(page.locator('[data-testid="iteration-self"]')).toBeVisible();
    await expect(page.locator('[data-testid="iteration-review"]')).toBeVisible();
    
    // Each iteration should show score, actor, and timestamp
    await expect(page.locator('[data-testid="iteration-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="iteration-actor"]')).toBeVisible();
    await expect(page.locator('[data-testid="iteration-timestamp"]')).toBeVisible();
    
    // Check rationale is shown
    await expect(page.locator('[data-testid="iteration-rationale"]')).toBeVisible();
  });

  test('should enforce scoring permissions', async ({ page }) => {
    // Login as team member
    await helpers.login(DEMO_USERS.teamMember);
    
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-item-0"]');
    
    // Team member should only see self scoring option
    await expect(page.locator('[data-testid="button-self-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-review-score"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="button-override-score"]')).not.toBeVisible();
    
    // Login as project lead
    await page.click('[data-testid="button-logout"]');
    await helpers.login(DEMO_USERS.projectLead);
    
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-item-0"]');
    
    // Project lead should see review option
    await expect(page.locator('[data-testid="button-review-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-override-score"]')).not.toBeVisible();
    
    // Login as functional leader
    await page.click('[data-testid="button-logout"]');
    await helpers.login(DEMO_USERS.functionalLeader);
    
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-item-0"]');
    
    // Functional leader should see override option
    await expect(page.locator('[data-testid="button-override-score"]')).toBeVisible();
  });

  test('should validate scoring inputs', async ({ page }) => {
    await helpers.login(DEMO_USERS.teamMember);
    
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-item-0"]');
    
    // Open scoring modal
    await page.click('[data-testid="button-self-score"]');
    await helpers.expectModal('[data-testid="scoring-modal"]');
    
    // Try to submit without score
    await page.click('[data-testid="button-submit-self-score"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="score-required-error"]')).toBeVisible();
    
    // Select score but leave rationale empty
    await page.click('[data-testid="score-3"]');
    await page.click('[data-testid="button-submit-self-score"]');
    
    // Should show rationale required error
    await expect(page.locator('[data-testid="rationale-required-error"]')).toBeVisible();
    
    // Provide minimal rationale
    await page.fill('[data-testid="self-rationale"]', 'ok');
    await page.click('[data-testid="button-submit-self-score"]');
    
    // Should show minimum length error
    await expect(page.locator('[data-testid="rationale-length-error"]')).toBeVisible();
  });

  test('should handle concurrent scoring attempts', async ({ page }) => {
    // Simulate two users trying to score the same task
    await helpers.login(DEMO_USERS.teamMember);
    
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-item-0"]');
    
    // Open scoring modal
    await page.click('[data-testid="button-self-score"]');
    
    // Simulate another user already scored (mock API response)
    await page.route('/api/tasks/*/scores', route => {
      route.fulfill({
        status: 409,
        body: JSON.stringify({ error: 'Task already scored by this user' })
      });
    });
    
    // Try to submit score
    await page.click('[data-testid="score-4"]');
    await page.fill('[data-testid="self-rationale"]', 'Good work completed');
    await page.click('[data-testid="button-submit-self-score"]');
    
    // Should show conflict error
    await expect(page.locator('[data-testid="scoring-conflict-error"]')).toBeVisible();
    await expect(page.locator('text=already scored')).toBeVisible();
  });

  test('should show score statistics and trends', async ({ page }) => {
    await helpers.login(DEMO_USERS.projectLead);
    
    // Navigate to scoring analytics
    await page.goto('/dashboard/analytics/scoring');
    
    // Check score distribution chart
    await helpers.waitForCharts();
    await expect(page.locator('[data-testid="score-distribution-chart"]')).toBeVisible();
    
    // Check scoring trends
    await expect(page.locator('[data-testid="scoring-trends-chart"]')).toBeVisible();
    
    // Check team performance summary
    await expect(page.locator('[data-testid="team-performance-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="scoring-completion-rate"]')).toBeVisible();
  });

  test('should export scoring data', async ({ page }) => {
    await helpers.login(DEMO_USERS.projectLead);
    
    await page.goto('/dashboard/analytics/scoring');
    
    // Export score data as CSV
    const csvDownload = await helpers.expectDownload(
      '[data-testid="button-export-scores-csv"]',
      'scores.csv'
    );
    
    expect(csvDownload.suggestedFilename()).toContain('scores');
    expect(csvDownload.suggestedFilename()).toContain('.csv');
    
    // Export detailed scoring report
    const reportDownload = await helpers.expectDownload(
      '[data-testid="button-export-scoring-report"]',
      'scoring-report.pdf'
    );
    
    expect(reportDownload.suggestedFilename()).toContain('report');
  });

  test('should handle scoring workflow notifications', async ({ page }) => {
    await helpers.login(DEMO_USERS.teamMember);
    
    await page.goto('/dashboard/tasks');
    await page.click('[data-testid="task-item-0"]');
    
    // Submit self score
    await page.click('[data-testid="button-self-score"]');
    await page.click('[data-testid="score-4"]');
    await page.fill('[data-testid="self-rationale"]', 'Task completed successfully');
    await page.click('[data-testid="button-submit-self-score"]');
    
    // Check success notification
    await expect(page.locator('[data-testid="score-submitted-notification"]')).toBeVisible();
    await expect(page.locator('text=Score submitted successfully')).toBeVisible();
    
    // Check next steps guidance
    await expect(page.locator('[data-testid="next-steps-guidance"]')).toBeVisible();
    await expect(page.locator('text=Your score has been submitted for review')).toBeVisible();
  });

  test('should support mobile scoring interface', async ({ page }) => {
    await helpers.setMobileViewport();
    await helpers.login(DEMO_USERS.teamMember);
    
    await page.goto('/dashboard/tasks');
    await helpers.expectHeaderFooter();
    
    // Open task on mobile
    await page.click('[data-testid="task-item-0"]');
    
    // Scoring interface should be mobile-friendly
    await page.click('[data-testid="button-self-score"]');
    await expect(page.locator('[data-testid="scoring-modal"]')).toBeVisible();
    
    // Score buttons should be touch-friendly
    await expect(page.locator('[data-testid="score-buttons"]')).toBeVisible();
    
    // Mobile layout should be responsive
    await page.click('[data-testid="score-4"]');
    await page.fill('[data-testid="self-rationale"]', 'Mobile scoring test');
    await page.click('[data-testid="button-submit-self-score"]');
    
    await helpers.waitForLoadingToComplete();
    await expect(page.locator('[data-testid="score-submitted-notification"]')).toBeVisible();
  });
});