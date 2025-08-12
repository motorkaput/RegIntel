import { test, expect } from '@playwright/test';

test.describe('Health Checks', () => {
  test('server responds correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check page loads
    await expect(page).toHaveTitle(/Dark Street Tech|PerMeaTe/);
    
    // Check for basic elements
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Verify no console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Allow some console errors but not critical ones
    const criticalErrors = logs.filter(log => 
      log.includes('Failed to fetch') || 
      log.includes('TypeError') ||
      log.includes('ReferenceError')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('API endpoints respond', async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get('/api/health');
    expect(healthResponse.status()).toBeLessThan(500);
    
    // Test registration endpoint structure (should return validation error)
    const registerResponse = await request.post('/api/tenants/register', {
      data: { test: true }
    });
    expect(registerResponse.status()).toBe(400); // Should validate and reject
    
    const registerData = await registerResponse.json();
    expect(registerData).toHaveProperty('error');
  });

  test('database connectivity', async ({ request }) => {
    // Test an endpoint that requires database
    const response = await request.get('/api/permeate/auth/user');
    // Should return 401 (unauthorized) not 500 (server error)
    expect([200, 401]).toContain(response.status());
  });
});