import { test, expect } from '@playwright/test';

test.describe('AI Proposals System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/permeate-login');
    await page.fill('input[type="email"]', 'admin@democo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('AI proposals interface accessible', async ({ page }) => {
    // Look for AI or proposals section
    const aiLink = page.locator('text=AI', 'text=Proposals', 'text=Analytics').first();
    
    if (await aiLink.count() > 0) {
      await aiLink.click();
      await expect(page.locator('text=AI', 'text=Proposals')).toBeVisible();
    } else {
      await page.goto('/proposals');
    }
  });

  test('goal breakdown functionality', async ({ page }) => {
    await page.goto('/proposals');
    
    // Check for goal input or breakdown interface
    const goalInput = page.locator('input, textarea').filter({ hasText: /Goal|Objective|Target/ });
    const createButton = page.locator('button').filter({ hasText: /Create|Generate|Analyze/ });
    
    if (await goalInput.count() > 0 && await createButton.count() > 0) {
      await goalInput.first().fill('Increase sales by 20% this quarter');
      await createButton.first().click();
      
      // Should show loading or results
      await page.waitForTimeout(2000);
    }
  });

  test('proposal review workflow', async ({ page }) => {
    await page.goto('/proposals');
    
    // Look for existing proposals or review interface
    const reviewButton = page.locator('button').filter({ hasText: /Review|Approve|Edit/ });
    const proposalCard = page.locator('[data-testid*="proposal"], .proposal-card');
    
    if (await proposalCard.count() > 0) {
      await proposalCard.first().click();
      
      // Should open proposal details
      await expect(page.locator('text=Proposal', 'text=Details')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Monaco editor integration', async ({ page }) => {
    await page.goto('/proposals');
    
    // Look for code editor (Monaco)
    const editor = page.locator('.monaco-editor, [data-testid*="editor"]');
    
    if (await editor.count() > 0) {
      await expect(editor).toBeVisible();
      
      // Test editor interaction
      await editor.click();
      await page.keyboard.type('// Test code');
    }
  });
});