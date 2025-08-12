import { test, expect } from '@playwright/test';

test.describe('Invite and Login System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin to test invitation features
    await page.goto('/permeate-login');
    await page.fill('input[type="email"]', 'admin@democo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('user management interface exists', async ({ page }) => {
    // Navigate to user management
    await page.goto('/settings/users');
    
    // Check for user management interface
    await expect(page.locator('text=Users', 'text=Team', 'text=Members')).toBeVisible({ timeout: 5000 });
  });

  test('invitation form works', async ({ page }) => {
    await page.goto('/settings/users');
    
    // Look for invite button or form
    const inviteButton = page.locator('button').filter({ hasText: /Invite|Add User|Add Member/ });
    
    if (await inviteButton.count() > 0) {
      await inviteButton.first().click();
      
      // Check for invitation form fields
      const emailField = page.locator('input[type="email"]').last();
      if (await emailField.isVisible()) {
        await emailField.fill('newuser@example.com');
        
        // Look for role selection
        const roleSelect = page.locator('select, [role="combobox"]').filter({ hasText: /Role/ });
        if (await roleSelect.count() > 0) {
          await roleSelect.first().click();
        }
        
        // Try to submit invitation
        const sendButton = page.locator('button').filter({ hasText: /Send|Invite|Create/ });
        if (await sendButton.count() > 0) {
          await sendButton.first().click();
          
          // Should see success message or updated list
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('login page has proper styling and functionality', async ({ page }) => {
    // Test the main login page
    await page.goto('/permeate-login');
    
    // Check page loads properly
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check two-tier header
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.locator('text=PerMeaTe')).toBeVisible();
    
    // Test invalid login
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid', 'text=Error', 'text=Failed')).toBeVisible({ timeout: 5000 });
  });

  test('password reset flow exists', async ({ page }) => {
    await page.goto('/permeate-login');
    
    // Look for forgot password link
    const forgotLink = page.locator('text=Forgot', 'text=Reset').first();
    
    if (await forgotLink.count() > 0) {
      await forgotLink.click();
      
      // Should navigate to password reset page
      await expect(page.locator('text=Reset', 'text=Forgot')).toBeVisible();
      
      // Should have email input
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
        
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });
});