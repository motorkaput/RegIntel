import { test, expect } from '@playwright/test';
import { TestHelpers, DEMO_USERS } from './utils';

test.describe('Signup and Login Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should complete tenant registration with bootstrap token', async ({ page }) => {
    // Visit registration page
    await page.goto('/register');
    
    // Check header and footer are present
    await helpers.expectHeaderFooter();
    
    // Fill registration form
    await helpers.fillForm({
      'company_name': 'Test Company E2E',
      'admin_email': 'admin-e2e@testco.com',
      'admin_first_name': 'Admin',
      'admin_last_name': 'User',
      'bootstrap_token': process.env.BOOTSTRAP_TOKEN || 'demo-bootstrap-token'
    });
    
    // Submit registration
    await helpers.submitForm('[data-testid="button-register"]');
    
    // Should redirect to dashboard after successful registration
    await helpers.expectNavigation('/dashboard');
    
    // Check dashboard elements are visible
    await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
    await expect(page.locator('text=Welcome to PerMeaTe Enterprise')).toBeVisible();
    
    // Verify two-tier header in dashboard
    await helpers.expectHeaderFooter();
    
    // Check that user role is admin
    await expect(page.locator('[data-testid="user-role"]')).toContainText('admin');
  });

  test('should login existing demo user', async ({ page }) => {
    // Login as admin user
    await helpers.login(DEMO_USERS.admin);
    
    // Should be on dashboard
    await helpers.expectNavigation('/dashboard');
    
    // Check two-tier headers are present
    await helpers.expectHeaderFooter();
    
    // Check user info is displayed
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Alice Administrator');
    await expect(page.locator('[data-testid="user-role"]')).toContainText('admin');
  });

  test('should show different dashboard for different roles', async ({ page }) => {
    // Test org leader dashboard
    await helpers.login(DEMO_USERS.orgLeader);
    await helpers.expectNavigation('/dashboard');
    
    // Org leaders should see strategic overview
    await expect(page.locator('[data-testid="dashboard-org-overview"]')).toBeVisible();
    await expect(page.locator('text=Organization Overview')).toBeVisible();
    
    // Check role-specific navigation
    await expect(page.locator('[data-testid="nav-goals"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
  });

  test('should maintain session across page reloads', async ({ page }) => {
    // Login
    await helpers.login(DEMO_USERS.admin);
    await helpers.expectNavigation('/dashboard');
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await helpers.expectNavigation('/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    
    // Headers should still be present
    await helpers.expectHeaderFooter();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await helpers.login(DEMO_USERS.admin);
    await helpers.expectNavigation('/dashboard');
    
    // Click logout
    await page.click('[data-testid="button-logout"]');
    
    // Should redirect to login page
    await helpers.expectNavigation('/auth/login');
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should redirect back to auth
    await helpers.expectNavigation('/auth/login');
  });

  test('should handle invalid bootstrap token', async ({ page }) => {
    await page.goto('/register');
    
    await helpers.fillForm({
      'company_name': 'Test Company Invalid',
      'admin_email': 'admin-invalid@testco.com',
      'admin_first_name': 'Admin',
      'admin_last_name': 'User',
      'bootstrap_token': 'invalid-token-123'
    });
    
    await helpers.submitForm('[data-testid="button-register"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Invalid bootstrap token')).toBeVisible();
    
    // Should remain on registration page
    expect(page.url()).toContain('/register');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await helpers.submitForm('[data-testid="button-register"]');
    
    // Check validation errors
    await expect(page.locator('[data-testid="error-company-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-admin-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-bootstrap-token"]')).toBeVisible();
  });

  test('should show mobile responsive layout', async ({ page }) => {
    await helpers.setMobileViewport();
    
    await page.goto('/register');
    
    // Check mobile header layout
    await helpers.expectHeaderFooter();
    
    // Check form is mobile responsive
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();
    
    // Check that mobile navigation works
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});