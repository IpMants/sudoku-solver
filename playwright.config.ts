import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Sudoku Solver end-to-end test suite.
 *
 * These tests validate the user-facing scenarios documented in
 * `specs/001-sudoku-solver/quickstart.md` and
 * `specs/002-mobile-client-support/quickstart.md` against a real browser,
 * running against the Angular dev server (`ng serve`) which this config
 * starts automatically via `webServer`. The `mobile-chrome` and
 * `mobile-360` projects provide device emulation and a fixed 360px viewport
 * for the mobile-specific scenarios (research.md's Playwright decision).
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
    {
      // Mobile device emulation (specs/002-mobile-client-support/research.md's
      // Playwright decision): validates the on-screen keypad, responsive
      // layout, and touch interactions on a representative phone profile.
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      // Raw 360px-wide viewport (spec.md FR-001/SC-001's narrowest supported
      // phone width), independent of any specific device emulation profile.
      name: 'mobile-360',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 740 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run start -- --port 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
