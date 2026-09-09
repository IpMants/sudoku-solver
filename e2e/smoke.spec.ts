import { test, expect } from '@playwright/test';

/**
 * Placeholder end-to-end smoke test, wired up during Setup (T003) so the
 * `npm run e2e` script and CI pipeline have something runnable immediately.
 *
 * The full quickstart.md scenario coverage (default puzzle load, example
 * selection, custom entry with conflict/unsolvable handling, step-by-step
 * solving, reset, and the no-login guarantee) is implemented in T038 once
 * the corresponding features exist.
 */
test('app shell loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Sudoku/i);
});
