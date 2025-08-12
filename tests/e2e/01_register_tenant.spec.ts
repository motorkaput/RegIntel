import { test, expect } from '@playwright/test';

test.describe('Tenant Registration', () => {
  const uniqueId = Date.now();
  const testTenant = {
    company_name: `TestCorp ${uniqueId}`,
    domain: `testcorp-${uniqueId}`,
    admin_email: `admin-${uniqueId}@testcorp.com`,
    password: 'admin123',
    first_name: 'Test',
    last_name: 'Admin',
    bootstrap_token: 'bootstrap-dev-token-2024'
  };

  test('public registration page loads correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Check page structure
    await expect(page).toHaveTitle(/PerMeaTe Enterprise/);
    
    // Verify header with back button
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.locator('text=PerMeaTe Enterprise')).toBeVisible();
    
    // Check form fields
    await expect(page.locator('[data-testid="input-company-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-domain"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-last-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-bootstrap-token"]')).toBeVisible();
    
    // Check submit button
    await expect(page.locator('[data-testid="button-create-organization"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-create-organization"]')).toHaveText('Create Organization');
  });

  test('form validation works', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('[data-testid="button-create-organization"]');
    
    // Should show validation error (toast or inline)
    await expect(page.locator('text=Missing information')).toBeVisible({ timeout: 5000 });
  });

  test('successful registration creates tenant and redirects', async ({ page }) => {
    await page.goto('/register');
    
    // Fill out the form
    await page.fill('[data-testid="input-company-name"]', testTenant.company_name);
    await page.fill('[data-testid="input-domain"]', testTenant.domain);
    await page.fill('[data-testid="input-first-name"]', testTenant.first_name);
    await page.fill('[data-testid="input-last-name"]', testTenant.last_name);
    await page.fill('[data-testid="input-email"]', testTenant.admin_email);
    await page.fill('[data-testid="input-password"]', testTenant.password);
    await page.fill('[data-testid="input-bootstrap-token"]', testTenant.bootstrap_token);
    
    // Submit the form
    await page.click('[data-testid="button-create-organization"]');
    
    // Check for success message
    await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 });
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Verify we're logged in and on dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 5000 });
  });

  test('duplicate domain registration fails', async ({ page }) => {
    await page.goto('/register');
    
    // Try to register with same domain again
    await page.fill('[data-testid="input-company-name"]', 'Duplicate Corp');
    await page.fill('[data-testid="input-domain"]', testTenant.domain); // Same domain
    await page.fill('[data-testid="input-first-name"]', 'Duplicate');
    await page.fill('[data-testid="input-last-name"]', 'User');
    await page.fill('[data-testid="input-email"]', 'duplicate@test.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.fill('[data-testid="input-bootstrap-token"]', testTenant.bootstrap_token);
    
    await page.click('[data-testid="button-create-organization"]');
    
    // Should show error about domain already existing
    await expect(page.locator('text=already exists')).toBeVisible({ timeout: 10000 });
  });
});