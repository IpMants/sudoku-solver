import { test, expect, devices } from '@playwright/test';

/**
 * End-to-end coverage of Mobile Client Support
 * (specs/002-mobile-client-support/quickstart.md), run against a real
 * browser via Playwright. Each `test.describe` block sets its own explicit
 * mobile viewport/touch emulation (rather than relying solely on the
 * `mobile-chrome`/`mobile-360` Playwright projects) so these scenarios
 * behave consistently no matter which configured project executes them.
 */

/** Counts how many of the 81 cell buttons currently have no digit (empty text content). */
async function countEmptyCells(page: import('@playwright/test').Page): Promise<number> {
  return page.locator('.sudoku-cell').evaluateAll(
    (cells) => cells.filter((cell) => (cell.textContent ?? '').trim() === '').length,
  );
}

test.describe('US1 — Solve a puzzle on a mobile browser', () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test('grid and controls fit with no horizontal scroll at 360px, and Solve All works', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sudoku-cell')).toHaveCount(81);

    // FR-001/SC-001: no horizontal scrolling is required at 360px wide.
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await page.getByRole('button', { name: 'Solve All' }).click();
    await expect(async () => {
      expect(await countEmptyCells(page)).toBe(0);
    }).toPass({ timeout: 5000 });
  });

  test('layout remains usable after rotating to landscape (FR-008)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await expect(page.locator('.sudoku-cell')).toHaveCount(81);

    // Simulate a portrait -> landscape rotation.
    await page.setViewportSize({ width: 740, height: 360 });
    await expect(page.locator('.sudoku-cell')).toHaveCount(81);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

test.describe('US2 — Enter custom digits by touch', () => {
  const { defaultBrowserType: _defaultBrowserType, ...pixel7 } = devices['Pixel 7'];
  test.use({ ...pixel7 });

  test('tap-to-select shows the on-screen keypad, a digit tap enters it, conflicts highlight, and Clear removes it', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Custom Puzzle' }).click();

    const cell = page.locator('#sudoku-cell-0');
    await cell.tap();

    const keypad = page.locator('.digit-keypad');
    await expect(keypad).toBeVisible();
    await expect(page.getByRole('group', { name: 'Digit entry keypad' })).toBeVisible();

    await keypad.getByRole('button', { name: 'Enter 5' }).tap();
    await expect(cell).toHaveText('5');

    // Enter the same digit into an adjacent cell in the same row to trigger a conflict.
    const neighborCell = page.locator('#sudoku-cell-1');
    await neighborCell.tap();
    await keypad.getByRole('button', { name: 'Enter 5' }).tap();
    await expect(neighborCell).toHaveClass(/conflict/);

    await keypad.getByRole('button', { name: 'Clear cell' }).tap();
    await expect(neighborCell).toHaveText('');
    await expect(neighborCell).not.toHaveClass(/conflict/);

    // Selecting a different cell moves the keypad's target without hiding it.
    const anotherCell = page.locator('#sudoku-cell-2');
    await anotherCell.tap();
    await expect(keypad).toBeVisible();
    await keypad.getByRole('button', { name: 'Enter 7' }).tap();
    await expect(anotherCell).toHaveText('7');
  });

  test('the keypad never renders a text input or an inputmode attribute (must not summon the native keyboard)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Custom Puzzle' }).click();
    await page.locator('#sudoku-cell-0').tap();

    await expect(page.locator('.digit-keypad')).toBeVisible();
    expect(await page.locator('.digit-keypad input').count()).toBe(0);
    expect(await page.locator('.digit-keypad [inputmode]').count()).toBe(0);
  });

  test('tapping outside the grid clears the selection and hides the keypad (US2/AC5, Edge Cases)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Custom Puzzle' }).click();

    const cell = page.locator('#sudoku-cell-0');
    await cell.tap();
    await expect(page.locator('.digit-keypad')).toBeVisible();
    await expect(cell).toHaveAttribute('aria-selected', 'true');

    // Tap genuinely blank page background (the heading), not any button/link
    // and not the grid or keypad itself.
    await page.locator('h1').tap();

    await expect(page.locator('.digit-keypad')).toHaveCount(0);
    await expect(cell).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('[aria-selected="true"]')).toHaveCount(0);
  });

  test('tapping "Solve Next Digit" while a cell is selected does not clear the selection (preserves 001-sudoku-solver US5/FR-013)', async ({
    page,
  }) => {
    await page.goto('/');

    const emptyIndex = await page
      .locator('.sudoku-cell')
      .evaluateAll((cells) => cells.findIndex((cell) => (cell.textContent ?? '').trim() === ''));
    await page.locator(`#sudoku-cell-${emptyIndex}`).tap();
    await expect(page.locator(`#sudoku-cell-${emptyIndex}`)).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('button', { name: 'Solve Next Digit' }).tap();

    // The click landed on a <button>, not blank background, so the outside-
    // click deselect handler (US2/AC5) must not have fired.
    await expect(page.locator(`#sudoku-cell-${emptyIndex}`)).toHaveAttribute('aria-selected', 'true');
  });

  test('rapid sequential taps on multiple keypad digits register every tap without drops or duplicates (FR-010)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Custom Puzzle' }).click();

    const keypad = page.locator('.digit-keypad');
    const targetIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const digitsToEnter = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Tap through 9 different cells, entering a different digit into each,
    // back-to-back with no waiting between taps, simulating fast touch input.
    for (let i = 0; i < targetIndices.length; i++) {
      await page.locator(`#sudoku-cell-${targetIndices[i]}`).tap();
      await keypad.getByRole('button', { name: `Enter ${digitsToEnter[i]}` }).tap();
    }

    // Every cell shows exactly the digit that was tapped for it — no drops
    // (a cell left empty) and no duplicates (a stale/adjacent digit landing
    // in the wrong cell).
    for (let i = 0; i < targetIndices.length; i++) {
      await expect(page.locator(`#sudoku-cell-${targetIndices[i]}`)).toHaveText(String(digitsToEnter[i]));
    }
  });

  test('a single keypad tap enters the digit and shows the conflict highlight within the same interaction, on a >=44x44px button (SC-003)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Custom Puzzle' }).click();
    await page.locator('#sudoku-cell-0').tap();

    const enterFiveButton = page.getByRole('button', { name: 'Enter 5' });
    const box = await enterFiveButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // First tap: no pre-existing conflict, so the first cell just receives the digit.
    await page.locator('#sudoku-cell-0').tap();
    await enterFiveButton.tap();
    await expect(page.locator('#sudoku-cell-0')).toHaveText('5');
    await expect(page.locator('#sudoku-cell-0')).not.toHaveClass(/conflict/);

    // Second tap: entering the same digit into a cell sharing cell 0's row
    // must register the digit AND show the conflict highlight immediately,
    // in the same interaction (no separate confirmation step).
    await page.locator('#sudoku-cell-1').tap();
    await enterFiveButton.tap();
    await expect(page.locator('#sudoku-cell-1')).toHaveText('5');
    await expect(page.locator('#sudoku-cell-1')).toHaveClass(/conflict/);
  });
});


test.describe('US3 — Use all existing features on mobile', () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test('example selection, Solve Next Digit, and Reset all behave the same as on desktop', async ({ page }) => {
    await page.goto('/');

    const items = page.locator('app-example-picker a[mat-list-item]');
    await expect(items).toHaveCount(5, { timeout: 5000 });
    await items.nth(1).tap();
    await page.waitForTimeout(200);

    const emptyBefore = await countEmptyCells(page);
    await page.getByRole('button', { name: 'Solve Next Digit' }).tap();
    await expect(async () => {
      expect(await countEmptyCells(page)).toBe(emptyBefore - 1);
    }).toPass({ timeout: 3000 });

    await page.getByRole('button', { name: 'Reset' }).tap();
    await expect(page.locator('.sudoku-cell.solver-filled')).toHaveCount(0);
  });
});
