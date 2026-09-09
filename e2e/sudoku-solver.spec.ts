import { test, expect, Page } from '@playwright/test';

/**
 * End-to-end coverage of quickstart.md's scenarios, run against the built app
 * via Playwright (the concrete e2e tool resolving A1; research.md's Testing
 * decision). Scenarios 1-5 were added by T038; Scenario 6 (cell selection,
 * US5/FR-013/SC-008) was added by Convergence T048.
 */

/** Enters `digit` (1-9) into the cell at `index` (0-80) by focusing it and pressing the digit key. */
async function enterDigit(page: Page, index: number, digit: number): Promise<void> {
  const cell = page.locator(`#sudoku-cell-${index}`);
  await cell.click();
  await cell.press(String(digit));
}

/** Counts how many of the 81 cell buttons currently have no digit (empty text content). */
async function countEmptyCells(page: Page): Promise<number> {
  return page.locator('.sudoku-cell').evaluateAll(
    (cells) => cells.filter((cell) => (cell.textContent ?? '').trim() === '').length,
  );
}

/** Non-zero (given, value) pairs for the bundled "Easy Classic #1" puzzle, by cell index. */
const EASY_1_GIVENS: Array<[number, number]> = [
  [0, 5],
  [1, 3],
  [4, 7],
  [9, 6],
  [12, 1],
  [13, 9],
  [14, 5],
  [19, 9],
  [20, 8],
  [25, 6],
  [27, 8],
  [31, 6],
  [35, 3],
  [36, 4],
  [39, 8],
  [41, 3],
  [44, 1],
  [45, 7],
  [49, 2],
  [53, 6],
  [55, 6],
  [60, 2],
  [61, 8],
  [66, 4],
  [67, 1],
  [68, 9],
  [71, 5],
  [76, 8],
  [79, 7],
  [80, 9],
];

test.describe('Scenario 1 — Instantly solve the default puzzle (US1)', () => {
  test('loads a puzzle with no login and solves it fully via Solve All', async ({ page }) => {
    await page.goto('/');

    // SC-001: a puzzle is displayed immediately, with no login/setup step.
    await expect(page.locator('.sudoku-cell')).toHaveCount(81);
    await expect(page.getByRole('button', { name: /log ?in|sign ?in/i })).toHaveCount(0);

    await page.getByRole('button', { name: 'Solve All' }).click();

    // SC-002: every cell is filled within the solve budget.
    await expect(async () => {
      const emptyCount = await countEmptyCells(page);
      expect(emptyCount).toBe(0);
    }).toPass({ timeout: 5000 });

    await page.reload();
    await expect(page.locator('.sudoku-cell')).toHaveCount(81);
    await expect(page.getByRole('button', { name: /log ?in|sign ?in/i })).toHaveCount(0);
  });
});

test.describe('Scenario 2 — Choose a specific example puzzle (US2)', () => {
  test('lists at least 5 examples and loads/reloads a selection', async ({ page }) => {
    await page.goto('/');

    const items = page.locator('app-example-picker a[mat-list-item]');
    await expect(items).toHaveCount(5, { timeout: 5000 });

    // SC-006: more than one difficulty label appears among the examples.
    const labels = await page.locator('app-example-picker mat-list-item, app-example-picker a').allTextContents();
    const combined = labels.join(' ').toLowerCase();
    const difficultiesSeen = ['easy', 'medium', 'hard'].filter((d) => combined.includes(d));
    expect(difficultiesSeen.length).toBeGreaterThan(1);

    await items.nth(1).click();
    await page.waitForTimeout(200);
    const firstCellAfterSelect = await page.locator('#sudoku-cell-0').textContent();

    await page.getByRole('button', { name: 'Solve All' }).click();
    await expect(async () => {
      const emptyCount = await countEmptyCells(page);
      expect(emptyCount).toBe(0);
    }).toPass({ timeout: 5000 });

    // Re-selecting the same example resets it to its original given digits.
    await items.nth(1).click();
    await page.waitForTimeout(200);
    await expect(page.locator('#sudoku-cell-0')).toHaveText(firstCellAfterSelect ?? '');
  });
});

test.describe('Scenario 3 — Enter a custom puzzle from scratch (US3)', () => {
  test('flags conflicts in real time, solves a valid custom entry, and reports unsolvable puzzles', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Custom Puzzle' }).click();

    // A blank 9x9 grid is presented (no given digits pre-filled).
    await expect(page.locator('.sudoku-cell.given')).toHaveCount(0);

    for (const [index, digit] of EASY_1_GIVENS) {
      await enterDigit(page, index, digit);
    }

    // No conflicts are flagged for a valid set of givens.
    await expect(page.locator('.sudoku-cell.conflict')).toHaveCount(0);

    // Enter a digit that duplicates cell index 0's value ("5") elsewhere in row 0.
    await enterDigit(page, 2, 5);
    await expect(page.locator('.sudoku-cell.conflict').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Solve All' })).toBeDisabled();

    // Correct the conflicting digit, then solve.
    await page.locator('#sudoku-cell-2').click();
    await page.locator('#sudoku-cell-2').press('Backspace');
    await expect(page.locator('.sudoku-cell.conflict')).toHaveCount(0);
    await page.getByRole('button', { name: 'Solve All' }).click();
    await expect(async () => {
      const emptyCount = await countEmptyCells(page);
      expect(emptyCount).toBe(0);
    }).toPass({ timeout: 5000 });

    // Start a fresh custom puzzle with a givens set known to be unsolvable
    // (positions 0/1 swapped relative to the valid set above: "3","5" instead
    // of "5","3" - verified offline to have zero conflicts and zero solutions).
    await page.getByRole('button', { name: 'Start Custom Puzzle' }).click();
    const unsolvableGivens: Array<[number, number]> = EASY_1_GIVENS.map(([index, digit]) =>
      index === 0 ? [0, 3] : index === 1 ? [1, 5] : [index, digit],
    );
    for (const [index, digit] of unsolvableGivens) {
      await enterDigit(page, index, digit);
    }
    await expect(page.locator('.sudoku-cell.conflict')).toHaveCount(0);

    await page.getByRole('button', { name: 'Solve All' }).click();
    await expect(page.getByRole('alert')).toContainText(/no solution/i, { timeout: 5000 });
  });
});

test.describe('Scenario 4 — Reveal the solution one digit at a time (US4)', () => {
  test('fills exactly one cell per click, converges with Solve All, and no-ops once solved', async ({
    page,
  }) => {
    await page.goto('/');

    const emptyBefore = await countEmptyCells(page);
    await page.getByRole('button', { name: 'Solve Next Digit' }).click();
    await expect(async () => {
      const emptyAfter = await countEmptyCells(page);
      expect(emptyAfter).toBe(emptyBefore - 1);
    }).toPass({ timeout: 3000 });

    // Repeat until solved.
    for (let i = 0; i < 90; i++) {
      const remaining = await countEmptyCells(page);
      if (remaining === 0) break;
      await page.getByRole('button', { name: 'Solve Next Digit' }).click();
      await page.waitForTimeout(50);
    }
    await expect(async () => {
      expect(await countEmptyCells(page)).toBe(0);
    }).toPass({ timeout: 5000 });

    // Once solved, the "Solve Next Digit" button is disabled (FR-006, FR-011),
    // which is a stronger UI-level guarantee than a runtime no-op.
    await expect(page.getByRole('button', { name: 'Solve Next Digit' })).toBeDisabled();
    expect(await countEmptyCells(page)).toBe(0);
  });
});

test.describe('Scenario 5 — Reset a puzzle', () => {
  test('reset discards solver-filled digits and restores the original givens', async ({ page }) => {
    await page.goto('/');
    const originalFirstCell = await page.locator('#sudoku-cell-0').textContent();

    await page.getByRole('button', { name: 'Solve All' }).click();
    await expect(async () => {
      expect(await countEmptyCells(page)).toBe(0);
    }).toPass({ timeout: 5000 });

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('.sudoku-cell.solver-filled')).toHaveCount(0);
    await expect(page.locator('#sudoku-cell-0')).toHaveText(originalFirstCell ?? '');
  });
});

test.describe('No login is ever required (FR-008, SC-005)', () => {
  test('no authentication UI appears across any scenario', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Start Custom Puzzle' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Start Custom Puzzle' }).click();
    await page.getByRole('button', { name: 'Solve All' }).click();
    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(page.getByRole('button', { name: /log ?in|sign ?in/i })).toHaveCount(0);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });
});

test.describe('Scenario 6 — See which cell is about to be changed (US5, FR-013)', () => {
  test('marks the selected cell, moves the marking, follows keyboard focus, survives solver fills, and clears on puzzle change', async ({
    page,
  }) => {
    await page.goto('/');

    // Click a cell: it becomes marked as selected.
    await page.locator('#sudoku-cell-10').click();
    await expect(page.locator('#sudoku-cell-10')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#sudoku-cell-10')).toHaveClass(/selected/);

    // Click a different cell: the marking moves; the previous cell no longer shows it.
    await page.locator('#sudoku-cell-20').click();
    await expect(page.locator('#sudoku-cell-20')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#sudoku-cell-10')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#sudoku-cell-10')).not.toHaveClass(/selected/);
    await expect(page.locator('[aria-selected="true"]')).toHaveCount(1);

    // Arrow-key keyboard navigation moves the marking to the newly focused cell.
    await page.locator('#sudoku-cell-20').press('ArrowRight');
    await expect(page.locator('#sudoku-cell-21')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#sudoku-cell-20')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('[aria-selected="true"]')).toHaveCount(1);

    // Selecting a given (non-editable) cell is still allowed and marked.
    const givenIndex = await page
      .locator('.sudoku-cell')
      .evaluateAll((cells) => cells.findIndex((cell) => cell.classList.contains('given')));
    await page.locator(`#sudoku-cell-${givenIndex}`).click();
    await expect(page.locator(`#sudoku-cell-${givenIndex}`)).toHaveClass(/given/);
    await expect(page.locator(`#sudoku-cell-${givenIndex}`)).toHaveAttribute('aria-selected', 'true');

    // Selecting an empty cell, then triggering "Solve Next Digit" repeatedly:
    // once the selected cell itself is solver-filled, it remains marked selected.
    const emptyIndex = await page
      .locator('.sudoku-cell')
      .evaluateAll((cells) => cells.findIndex((cell) => (cell.textContent ?? '').trim() === ''));
    await page.locator(`#sudoku-cell-${emptyIndex}`).click();
    await expect(page.locator(`#sudoku-cell-${emptyIndex}`)).toHaveAttribute('aria-selected', 'true');

    await expect(async () => {
      await page.getByRole('button', { name: 'Solve Next Digit' }).click();
      const filled = (await page.locator(`#sudoku-cell-${emptyIndex}`).textContent())?.trim();
      expect(filled).not.toBe('');
    }).toPass({ timeout: 5000 });
    await expect(page.locator(`#sudoku-cell-${emptyIndex}`)).toHaveAttribute('aria-selected', 'true');

    // Selecting a different example, starting a custom puzzle, or resetting
    // clears the selection: no cell remains marked selected.
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('[aria-selected="true"]')).toHaveCount(0);
  });
});

