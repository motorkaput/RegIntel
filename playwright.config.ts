import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially for data consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker to avoid database conflicts
  timeout: 90 * 1000, // 90 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },
  reporter: [
    ['line'],
    ['html', { outputFolder: './tests/e2e/report', open: 'never' }],
    ['junit', { outputFile: './tests/e2e/artifacts/junit-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },
  outputDir: './tests/e2e/artifacts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});