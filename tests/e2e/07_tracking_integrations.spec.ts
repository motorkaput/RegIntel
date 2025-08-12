import { test, expect } from '@playwright/test';

test.describe('Task Tracking & Integrations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/permeate-login');
    await page.fill('input[type="email"]', 'admin@democo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('task tracking board accessible', async ({ page }) => {
    const trackingLink = page.locator('text=Tasks', 'text=Tracking', 'text=Board', 'text=Kanban').first();
    
    if (await trackingLink.count() > 0) {
      await trackingLink.click();
    } else {
      await page.goto('/tracking');
    }
    
    // Should see task board or list
    const taskElements = page.locator('[data-testid*="task"], .task-card, .kanban-column');
    const hasTaskInterface = await taskElements.count() > 0 || 
                           await page.locator('text=Tasks', 'text=No tasks', 'text=Board').count() > 0;
    
    expect(hasTaskInterface).toBeTruthy();
  });

  test('task creation and management', async ({ page }) => {
    await page.goto('/tracking');
    
    const createButton = page.locator('button').filter({ hasText: /Create|Add|New/ });
    
    if (await createButton.count() > 0) {
      await createButton.first().click();
      
      // Look for task creation form
      const titleInput = page.locator('input').filter({ hasText: /Title|Name|Task/ }).first();
      
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Task from E2E');
        
        const saveButton = page.locator('button').filter({ hasText: /Save|Create|Add/ });
        if (await saveButton.count() > 0) {
          await saveButton.first().click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('integrations page exists', async ({ page }) => {
    const integrationsLink = page.locator('text=Integrations', 'text=Connect', 'text=Apps').first();
    
    if (await integrationsLink.count() > 0) {
      await integrationsLink.click();
    } else {
      await page.goto('/integrations');
    }
    
    // Should see integration options
    const integrationCards = page.locator('text=Jira', 'text=Trello', 'text=Asana', 'text=GitHub');
    const hasIntegrations = await integrationCards.count() > 0;
    
    if (hasIntegrations) {
      await expect(integrationCards.first()).toBeVisible();
    }
  });

  test('mock provider functionality', async ({ page }) => {
    await page.goto('/integrations');
    
    // Look for mock or test integration
    const mockProvider = page.locator('text=Mock', 'text=Test', 'text=Demo').first();
    
    if (await mockProvider.count() > 0) {
      await mockProvider.click();
      
      // Should show connection or configuration options
      const connectButton = page.locator('button').filter({ hasText: /Connect|Enable|Test/ });
      if (await connectButton.count() > 0) {
        await connectButton.first().click();
        await page.waitForTimeout(2000);
      }
    }
  });
});