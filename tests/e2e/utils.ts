import { Page, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface DemoUser {
  email: string;
  role: string;
  tenantId?: string;
}

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login helper that uses magic-link dev console mode if enabled
   */
  async login(user: DemoUser) {
    await this.page.goto('/auth/login');
    
    // Check if we're in dev mode with console email
    const isDevMode = process.env.DEV_EMAIL_MODE === 'console';
    
    if (isDevMode) {
      // Fill email and trigger magic link
      await this.page.fill('input[type="email"]', user.email);
      await this.page.click('button[type="submit"]');
      
      // In dev mode, the magic link would be logged to console
      // For E2E tests, we'll simulate the magic link redirect
      await this.page.goto(`/auth/callback?token=demo-token&email=${encodeURIComponent(user.email)}`);
    } else {
      // Production login flow
      await this.page.fill('input[type="email"]', user.email);
      await this.page.fill('input[type="password"]', 'demo-password-123');
      await this.page.click('button[type="submit"]');
    }
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard');
    await expect(this.page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
  }

  /**
   * File upload helper for CSV and other files
   */
  async uploadFile(fileInputSelector: string, fileName: string, content?: string) {
    const filePath = content 
      ? this.createTempFile(fileName, content)
      : join(process.cwd(), 'docs', 'samples', fileName);
    
    await this.page.setInputFiles(fileInputSelector, filePath);
  }

  /**
   * Create temporary file for testing
   */
  private createTempFile(fileName: string, content: string): string {
    const tempDir = join(process.cwd(), 'tests', 'temp');
    const filePath = join(tempDir, fileName);
    
    // Ensure temp directory exists
    const { mkdirSync, writeFileSync } = require('fs');
    try {
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(filePath, content);
    } catch (error) {
      console.warn('Failed to create temp file:', error);
    }
    
    return filePath;
  }

  /**
   * Assert two-tier sticky header and footer are present
   */
  async expectHeaderFooter() {
    // Check for company header (tier 1)
    await expect(this.page.locator('[data-testid="header-company"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="header-company"]')).toHaveClass(/h-12/);
    
    // Check for app header (tier 2) - only on authenticated pages
    const url = this.page.url();
    if (url.includes('/dashboard')) {
      await expect(this.page.locator('[data-testid="header-app"]')).toBeVisible();
      await expect(this.page.locator('[data-testid="header-app"]')).toHaveClass(/h-12/);
    }
    
    // Check for footer
    await expect(this.page.locator('[data-testid="footer-company"]')).toBeVisible();
    await expect(this.page.locator('text=© 2024 Dark Street Tech')).toBeVisible();
  }

  /**
   * Wait for navigation and check URL
   */
  async expectNavigation(expectedPath: string) {
    await this.page.waitForURL(expectedPath);
    expect(this.page.url()).toContain(expectedPath);
  }

  /**
   * Check for loading states
   */
  async waitForLoadingToComplete() {
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('[data-testid*="loading"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Handle modals and dialogs
   */
  async expectModal(modalSelector: string) {
    await expect(this.page.locator(modalSelector)).toBeVisible();
  }

  async closeModal(closeButtonSelector?: string) {
    const selector = closeButtonSelector || '[data-testid="button-close-modal"]';
    await this.page.click(selector);
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  }

  /**
   * Table and list interactions
   */
  async expectTableData(tableSelector: string, expectedRowCount?: number) {
    const table = this.page.locator(tableSelector);
    await expect(table).toBeVisible();
    
    if (expectedRowCount) {
      const rows = table.locator('tbody tr');
      await expect(rows).toHaveCount(expectedRowCount);
    }
  }

  /**
   * Form helpers
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[name="${field}"]`, value);
    }
  }

  async submitForm(submitButtonSelector?: string) {
    const selector = submitButtonSelector || 'button[type="submit"]';
    await this.page.click(selector);
  }

  /**
   * Download helpers
   */
  async expectDownload(triggerSelector: string, expectedFileName?: string) {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click(triggerSelector)
    ]);
    
    if (expectedFileName) {
      expect(download.suggestedFilename()).toContain(expectedFileName);
    }
    
    return download;
  }

  /**
   * Drag and drop helpers
   */
  async dragAndDrop(sourceSelector: string, targetSelector: string) {
    await this.page.dragAndDrop(sourceSelector, targetSelector);
  }

  /**
   * API response helpers
   */
  async waitForApiResponse(urlPattern: string | RegExp, status?: number) {
    const response = await this.page.waitForResponse(response => {
      const url = response.url();
      const matches = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      
      return matches && (status ? response.status() === status : true);
    });
    
    return response;
  }

  /**
   * Local storage helpers
   */
  async setLocalStorage(key: string, value: string) {
    await this.page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key, value }
    );
  }

  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate(
      (key) => localStorage.getItem(key),
      key
    );
  }

  /**
   * Viewport and responsive helpers
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * URL parameter helpers
   */
  expectUrlParams(expectedParams: Record<string, string>) {
    const url = new URL(this.page.url());
    for (const [key, value] of Object.entries(expectedParams)) {
      expect(url.searchParams.get(key)).toBe(value);
    }
  }

  /**
   * Create sample CSV content for testing
   */
  createSampleCSV(): string {
    return `email,first_name,last_name,role,function_name,skills
john.doe@democo.com,John,Doe,team_member,Engineering,JavaScript;React;Node.js
jane.smith@democo.com,Jane,Smith,project_lead,Product,Product Strategy;Analytics
bob.johnson@democo.com,Bob,Johnson,team_member,Design,UI Design;Figma`;
  }

  /**
   * Wait for chart rendering
   */
  async waitForCharts() {
    // Wait for recharts to render
    await this.page.waitForSelector('[data-testid*="chart"], .recharts-wrapper', { timeout: 10000 });
    await this.page.waitForTimeout(1000); // Additional wait for animation
  }

  /**
   * Keyboard navigation helpers
   */
  async navigateWithKeyboard(key: string, times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.page.keyboard.press(key);
    }
  }

  /**
   * Accessibility helpers
   */
  async checkAriaLabels(selector: string) {
    const elements = this.page.locator(selector);
    const count = await elements.count();
    
    for (let i = 0; i < count; i++) {
      const element = elements.nth(i);
      await expect(element).toHaveAttribute('aria-label');
    }
  }
}

/**
 * Demo users for testing
 */
export const DEMO_USERS = {
  admin: {
    email: 'admin@democo.com',
    role: 'admin'
  },
  orgLeader: {
    email: 'ceo@democo.com',
    role: 'org_leader'
  },
  functionalLeader: {
    email: 'eng-lead@democo.com',
    role: 'functional_leader'
  },
  projectLead: {
    email: 'pm1@democo.com',
    role: 'project_lead'
  },
  teamMember: {
    email: 'dev1@democo.com',
    role: 'team_member'
  }
};