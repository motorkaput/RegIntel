import { test, expect } from '@playwright/test';
import { TestHelpers, DEMO_USERS } from './utils';

test.describe('CSV Onboarding Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(DEMO_USERS.admin);
  });

  test('should upload and process valid CSV file', async ({ page }) => {
    // Navigate to org upload page
    await page.goto('/dashboard/onboarding/org-upload');
    
    // Check headers are present
    await helpers.expectHeaderFooter();
    
    // Check page title and instructions
    await expect(page.locator('h1')).toContainText('Organization Data Upload');
    await expect(page.locator('[data-testid="upload-instructions"]')).toBeVisible();
    
    // Create valid CSV content
    const csvContent = helpers.createSampleCSV();
    
    // Upload the CSV file
    await helpers.uploadFile('[data-testid="file-input-csv"]', 'employees-valid.csv', csvContent);
    
    // Wait for file to be processed and preview to show
    await helpers.waitForLoadingToComplete();
    await expect(page.locator('[data-testid="csv-preview"]')).toBeVisible();
    
    // Check preview shows correct data
    await expect(page.locator('[data-testid="preview-row-0"]')).toContainText('John Doe');
    await expect(page.locator('[data-testid="preview-row-1"]')).toContainText('Jane Smith');
    await expect(page.locator('[data-testid="preview-row-2"]')).toContainText('Bob Johnson');
    
    // Check validation summary
    await expect(page.locator('[data-testid="validation-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="valid-rows-count"]')).toContainText('3');
    await expect(page.locator('[data-testid="error-rows-count"]')).toContainText('0');
    
    // Submit the processed data
    await page.click('[data-testid="button-submit-csv"]');
    
    // Wait for processing
    await helpers.waitForLoadingToComplete();
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=Successfully imported 3 employees')).toBeVisible();
    
    // Check that audit logs increased
    await page.goto('/dashboard/logs');
    await helpers.waitForLoadingToComplete();
    
    // Should see CSV import audit log
    await expect(page.locator('[data-testid="audit-log-csv-import"]')).toBeVisible();
  });

  test('should handle CSV with validation errors', async ({ page }) => {
    await page.goto('/dashboard/onboarding/org-upload');
    
    // Create CSV with errors
    const invalidCsvContent = `email,first_name,last_name,role,function_name,skills
invalid-email,John,Doe,team_member,Engineering,JavaScript
jane.smith@democo.com,,Smith,invalid_role,Product,Analytics
bob@democo.com,Bob,Johnson,team_member,,UI Design`;
    
    await helpers.uploadFile('[data-testid="file-input-csv"]', 'employees-invalid.csv', invalidCsvContent);
    
    await helpers.waitForLoadingToComplete();
    
    // Check error preview is shown
    await expect(page.locator('[data-testid="csv-errors"]')).toBeVisible();
    
    // Check specific error messages
    await expect(page.locator('[data-testid="error-row-0"]')).toContainText('Invalid email format');
    await expect(page.locator('[data-testid="error-row-1"]')).toContainText('First name is required');
    await expect(page.locator('[data-testid="error-row-2"]')).toContainText('Function name is required');
    
    // Submit button should be disabled or show warning
    const submitButton = page.locator('[data-testid="button-submit-csv"]');
    await expect(submitButton).toBeDisabled();
    
    // Check validation summary
    await expect(page.locator('[data-testid="valid-rows-count"]')).toContainText('0');
    await expect(page.locator('[data-testid="error-rows-count"]')).toContainText('3');
  });

  test('should download sample CSV template', async ({ page }) => {
    await page.goto('/dashboard/onboarding/org-upload');
    
    // Click download sample button
    const download = await helpers.expectDownload(
      '[data-testid="button-download-sample"]',
      'sample-employees.csv'
    );
    
    // Verify download completed
    expect(download.suggestedFilename()).toContain('sample');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should show upload progress for large files', async ({ page }) => {
    await page.goto('/dashboard/onboarding/org-upload');
    
    // Create a larger CSV (simulate with many rows)
    const largeCsvContent = 'email,first_name,last_name,role,function_name,skills\n' + 
      Array.from({ length: 100 }, (_, i) => 
        `user${i}@democo.com,User,${i},team_member,Engineering,JavaScript`
      ).join('\n');
    
    await helpers.uploadFile('[data-testid="file-input-csv"]', 'large-employees.csv', largeCsvContent);
    
    // Check progress indicator appears
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    
    // Wait for processing to complete
    await helpers.waitForLoadingToComplete();
    
    // Check final results
    await expect(page.locator('[data-testid="csv-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="valid-rows-count"]')).toContainText('100');
  });

  test('should handle file type validation', async ({ page }) => {
    await page.goto('/dashboard/onboarding/org-upload');
    
    // Try to upload non-CSV file
    const txtContent = 'This is not a CSV file';
    await helpers.uploadFile('[data-testid="file-input-csv"]', 'invalid.txt', txtContent);
    
    // Should show file type error
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible();
    await expect(page.locator('text=Please upload a CSV file')).toBeVisible();
    
    // Preview should not appear
    await expect(page.locator('[data-testid="csv-preview"]')).not.toBeVisible();
  });

  test('should preserve data during navigation', async ({ page }) => {
    await page.goto('/dashboard/onboarding/org-upload');
    
    // Upload valid CSV
    const csvContent = helpers.createSampleCSV();
    await helpers.uploadFile('[data-testid="file-input-csv"]', 'employees.csv', csvContent);
    await helpers.waitForLoadingToComplete();
    
    // Navigate away and back
    await page.goto('/dashboard');
    await page.goto('/dashboard/onboarding/org-upload');
    
    // Data should be preserved (if using local storage)
    const preservedData = await helpers.getLocalStorage('csv-upload-data');
    if (preservedData) {
      await expect(page.locator('[data-testid="csv-preview"]')).toBeVisible();
    }
  });

  test('should show mobile responsive upload interface', async ({ page }) => {
    await helpers.setMobileViewport();
    await page.goto('/dashboard/onboarding/org-upload');
    
    // Check mobile layout
    await helpers.expectHeaderFooter();
    
    // Upload area should be mobile friendly
    await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();
    
    // Instructions should be readable on mobile
    await expect(page.locator('[data-testid="upload-instructions"]')).toBeVisible();
  });

  test('should validate required columns', async ({ page }) => {
    await page.goto('/dashboard/onboarding/org-upload');
    
    // CSV missing required columns
    const incompleteCsv = `first_name,last_name
John,Doe
Jane,Smith`;
    
    await helpers.uploadFile('[data-testid="file-input-csv"]', 'incomplete.csv', incompleteCsv);
    await helpers.waitForLoadingToComplete();
    
    // Should show missing columns error
    await expect(page.locator('[data-testid="missing-columns-error"]')).toBeVisible();
    await expect(page.locator('text=Missing required columns: email, role')).toBeVisible();
  });

  test('should handle duplicate email addresses', async ({ page }) => {
    await page.goto('/dashboard/onboarding/org-upload');
    
    // CSV with duplicate emails
    const duplicateCsv = `email,first_name,last_name,role,function_name,skills
john.doe@democo.com,John,Doe,team_member,Engineering,JavaScript
john.doe@democo.com,Johnny,Doe,team_member,Engineering,React`;
    
    await helpers.uploadFile('[data-testid="file-input-csv"]', 'duplicates.csv', duplicateCsv);
    await helpers.waitForLoadingToComplete();
    
    // Should show duplicate email warning
    await expect(page.locator('[data-testid="duplicate-emails-warning"]')).toBeVisible();
    await expect(page.locator('text=Duplicate email addresses found')).toBeVisible();
  });
});