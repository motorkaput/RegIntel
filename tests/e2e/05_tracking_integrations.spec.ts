import { test, expect } from '@playwright/test';
import { TestHelpers, DEMO_USERS } from './utils';

test.describe('Tracking and Integrations Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(DEMO_USERS.projectLead);
  });

  test('should navigate and interact with kanban board', async ({ page }) => {
    // Navigate to tracking board
    await page.goto('/dashboard/tracking/board');
    await helpers.expectHeaderFooter();
    
    // Check board layout
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-todo"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-review"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-done"]')).toBeVisible();
    
    // Check tasks are loaded
    await expect(page.locator('[data-testid^="task-card-"]')).toHaveCount(5, { timeout: 10000 });
    
    // Verify columns have proper headers
    await expect(page.locator('[data-testid="column-todo"] h3')).toContainText('To Do');
    await expect(page.locator('[data-testid="column-in-progress"] h3')).toContainText('In Progress');
  });

  test('should drag task between columns', async ({ page }) => {
    await page.goto('/dashboard/tracking/board');
    await helpers.waitForLoadingToComplete();
    
    // Find a task in "To Do" column
    const todoTask = page.locator('[data-testid="column-todo"] [data-testid^="task-card-"]').first();
    await expect(todoTask).toBeVisible();
    
    // Get task ID for verification
    const taskId = await todoTask.getAttribute('data-task-id');
    
    // Drag task from "To Do" to "In Progress"
    await helpers.dragAndDrop(
      `[data-testid="task-card-${taskId}"]`,
      '[data-testid="column-in-progress"]'
    );
    
    // Wait for API call to update status
    await helpers.waitForApiResponse('/api/tasks/*/status');
    
    // Verify task moved to new column
    await expect(page.locator(`[data-testid="column-in-progress"] [data-task-id="${taskId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="column-todo"] [data-task-id="${taskId}"]`)).not.toBeVisible();
    
    // Check status update notification
    await expect(page.locator('[data-testid="status-update-notification"]')).toBeVisible();
    await expect(page.locator('text=Task status updated')).toBeVisible();
  });

  test('should link MockProvider issue to task', async ({ page }) => {
    await page.goto('/dashboard/tracking/board');
    
    // Open a task card
    await page.click('[data-testid^="task-card-"]');
    await helpers.expectModal('[data-testid="task-details-modal"]');
    
    // Click link external issue
    await page.click('[data-testid="button-link-external"]');
    await helpers.expectModal('[data-testid="integration-modal"]');
    
    // Select MockProvider
    await page.selectOption('[data-testid="provider-select"]', 'mockprovider');
    
    // Enter mock issue ID
    await page.fill('[data-testid="external-issue-id"]', 'MOCK-123');
    await page.fill('[data-testid="external-issue-title"]', 'Mock Issue for Testing');
    
    // Link the issue
    await page.click('[data-testid="button-link-issue"]');
    await helpers.waitForLoadingToComplete();
    
    // Verify WorkItem link appears
    await expect(page.locator('[data-testid="work-item-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="external-issue-id"]')).toContainText('MOCK-123');
    await expect(page.locator('[data-testid="provider-badge"]')).toContainText('MockProvider');
    
    // Click external link
    await page.click('[data-testid="external-issue-link"]');
    
    // Should open in new tab (check that href is correct)
    const linkElement = page.locator('[data-testid="external-issue-link"]');
    await expect(linkElement).toHaveAttribute('href', /mock/);
    await expect(linkElement).toHaveAttribute('target', '_blank');
  });

  test('should sync with external provider', async ({ page }) => {
    await page.goto('/dashboard/integrations');
    
    // Check integrations page
    await expect(page.locator('[data-testid="integrations-overview"]')).toBeVisible();
    
    // Check MockProvider status
    await expect(page.locator('[data-testid="provider-mockprovider"]')).toBeVisible();
    await expect(page.locator('[data-testid="mock-provider-status"]')).toContainText('Connected');
    
    // Trigger manual sync
    await page.click('[data-testid="button-sync-mockprovider"]');
    
    // Check sync progress
    await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();
    await helpers.waitForLoadingToComplete();
    
    // Check sync results
    await expect(page.locator('[data-testid="sync-completed"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-summary"]')).toBeVisible();
    
    // Verify last sync time updated
    await expect(page.locator('[data-testid="last-sync-time"]')).toBeVisible();
  });

  test('should configure integration webhooks', async ({ page }) => {
    await page.goto('/dashboard/integrations/webhooks');
    
    // Check webhook configuration page
    await expect(page.locator('[data-testid="webhook-config"]')).toBeVisible();
    
    // Check MockProvider webhook URL
    await expect(page.locator('[data-testid="webhook-url-mockprovider"]')).toBeVisible();
    
    // Copy webhook URL
    await page.click('[data-testid="button-copy-webhook-url"]');
    
    // Check clipboard notification
    await expect(page.locator('[data-testid="clipboard-notification"]')).toBeVisible();
    
    // Test webhook endpoint
    await page.click('[data-testid="button-test-webhook"]');
    
    // Check test results
    await expect(page.locator('[data-testid="webhook-test-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="webhook-status"]')).toContainText('Success');
  });

  test('should handle webhook events', async ({ page }) => {
    // Mock webhook payload
    const webhookPayload = {
      event: 'issue.updated',
      data: {
        issue: {
          id: 'MOCK-123',
          status: 'Done',
          title: 'Test Issue'
        }
      }
    };
    
    // Send webhook to test endpoint
    await page.request.post('/api/integrations/webhook/mockprovider', {
      data: webhookPayload,
      headers: {
        'Content-Type': 'application/json',
        'X-Hook-Signature': 'test-signature'
      }
    });
    
    // Navigate to tracking board to see updates
    await page.goto('/dashboard/tracking/board');
    await helpers.waitForLoadingToComplete();
    
    // Check that task status was updated via webhook
    await expect(page.locator('[data-testid="task-MOCK-123"]')).toBeVisible();
    
    // Check webhook activity log
    await page.goto('/dashboard/integrations/activity');
    await expect(page.locator('[data-testid="webhook-activity"]')).toBeVisible();
    await expect(page.locator('[data-testid="webhook-event-0"]')).toContainText('issue.updated');
  });

  test('should filter and search tasks on board', async ({ page }) => {
    await page.goto('/dashboard/tracking/board');
    await helpers.waitForLoadingToComplete();
    
    // Apply assignee filter
    await page.click('[data-testid="filter-assignee"]');
    await page.selectOption('[data-testid="assignee-select"]', 'Grace Developer');
    
    // Check filtered results
    await helpers.waitForLoadingToComplete();
    const visibleTasks = page.locator('[data-testid^="task-card-"]');
    await expect(visibleTasks).toHaveCount(2, { timeout: 10000 });
    
    // Apply priority filter
    await page.click('[data-testid="filter-priority"]');
    await page.selectOption('[data-testid="priority-select"]', 'high');
    
    // Check further filtered results
    await helpers.waitForLoadingToComplete();
    await expect(visibleTasks).toHaveCount(1, { timeout: 10000 });
    
    // Search by task title
    await page.fill('[data-testid="search-tasks"]', 'dashboard');
    await helpers.waitForLoadingToComplete();
    
    // Check search results
    await expect(page.locator('[data-testid^="task-card-"]')).toHaveCount(1, { timeout: 10000 });
    
    // Clear all filters
    await page.click('[data-testid="button-clear-filters"]');
    await helpers.waitForLoadingToComplete();
    
    // All tasks should be visible again
    await expect(page.locator('[data-testid^="task-card-"]')).toHaveCount(5, { timeout: 10000 });
  });

  test('should switch between board and list views', async ({ page }) => {
    await page.goto('/dashboard/tracking/board');
    
    // Switch to list view
    await page.click('[data-testid="button-list-view"]');
    await helpers.expectNavigation('/dashboard/tracking/list');
    
    // Check list view layout
    await expect(page.locator('[data-testid="tasks-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-list-header"]')).toBeVisible();
    
    // Check table columns
    await expect(page.locator('[data-testid="column-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-assignee"]')).toBeVisible();
    await expect(page.locator('[data-testid="column-priority"]')).toBeVisible();
    
    // Switch back to board view
    await page.click('[data-testid="button-board-view"]');
    await helpers.expectNavigation('/dashboard/tracking/board');
    
    // Should be back on kanban board
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
  });

  test('should create new task from board', async ({ page }) => {
    await page.goto('/dashboard/tracking/board');
    
    // Click add task in "To Do" column
    await page.click('[data-testid="button-add-task-todo"]');
    await helpers.expectModal('[data-testid="create-task-modal"]');
    
    // Fill task details
    await helpers.fillForm({
      'task_title': 'New E2E Test Task',
      'task_description': 'Task created during E2E testing',
      'task_priority': 'medium'
    });
    
    // Select assignee
    await page.selectOption('[data-testid="assignee-select"]', 'Grace Developer');
    
    // Set due date
    await page.fill('[data-testid="due-date"]', '2024-12-31');
    
    // Create task
    await page.click('[data-testid="button-create-task"]');
    await helpers.waitForLoadingToComplete();
    
    // Verify task appears in "To Do" column
    await expect(page.locator('[data-testid="column-todo"]')).toContainText('New E2E Test Task');
    
    // Check task details
    await page.click('[data-testid="task-card-new"]');
    await expect(page.locator('[data-testid="task-title"]')).toContainText('New E2E Test Task');
    await expect(page.locator('[data-testid="task-assignee"]')).toContainText('Grace Developer');
  });

  test('should handle provider connection errors', async ({ page }) => {
    // Mock provider connection failure
    await page.route('/api/integrations/mockprovider/status', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Provider connection failed' })
      });
    });
    
    await page.goto('/dashboard/integrations');
    
    // Check error status
    await expect(page.locator('[data-testid="provider-error"]')).toBeVisible();
    await expect(page.locator('text=connection failed')).toBeVisible();
    
    // Check retry button
    await expect(page.locator('[data-testid="button-retry-connection"]')).toBeVisible();
    
    // Check error guidance
    await expect(page.locator('[data-testid="error-guidance"]')).toBeVisible();
  });

  test('should support mobile board interaction', async ({ page }) => {
    await helpers.setMobileViewport();
    await page.goto('/dashboard/tracking/board');
    
    // Check mobile layout
    await helpers.expectHeaderFooter();
    
    // Board should be horizontally scrollable on mobile
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
    
    // Touch interactions should work
    await page.click('[data-testid^="task-card-"]');
    await expect(page.locator('[data-testid="task-details-modal"]')).toBeVisible();
    
    // Mobile-specific UI elements
    await expect(page.locator('[data-testid="mobile-task-actions"]')).toBeVisible();
  });

  test('should export tracking data', async ({ page }) => {
    await page.goto('/dashboard/tracking/board');
    
    // Open export options
    await page.click('[data-testid="button-export-tasks"]');
    await helpers.expectModal('[data-testid="export-modal"]');
    
    // Select export format
    await page.selectOption('[data-testid="export-format"]', 'csv');
    
    // Select date range
    await page.fill('[data-testid="export-from-date"]', '2024-01-01');
    await page.fill('[data-testid="export-to-date"]', '2024-12-31');
    
    // Export tasks
    const download = await helpers.expectDownload(
      '[data-testid="button-confirm-export"]',
      'tasks.csv'
    );
    
    expect(download.suggestedFilename()).toContain('tasks');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});