import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Sudoku Solver end-to-end test suite.
 *
 * These tests validate the user-facing scenarios documented in
 * `specs/001-sudoku-solver/quickstart.md` against a real browser, running
 * against the Angular dev server (`ng serve`) which this config starts
 * automatically via `webServer`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start -- --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
