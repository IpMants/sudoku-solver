import { Cell, computeBox, createEmptyCell } from './cell';

/**
 * Where a {@link Puzzle} currently in play came from (data-model.md: Puzzle).
 *
 * - `'example'`: loaded from the bundled example set (FR-002); `exampleId`
 *   references the {@link ExamplePuzzle} it was seeded from.
 * - `'custom'`: started blank and typed in manually by the user (FR-003).
 */
export type PuzzleSource = 'example' | 'custom';

/**
 * Derived lifecycle state of a {@link Puzzle}, used to gate the solve actions
 * (FR-011) and report unsolvable puzzles (FR-007). See data-model.md's state
 * transition diagram for the full set of valid transitions.
 */
export type PuzzleStatus = 'invalid' | 'unsolved' | 'solving' | 'solved' | 'unsolvable';

/**
 * One 9x9 sudoku grid currently in play (data-model.md: Puzzle).
 */
export interface Puzzle {
  /** The full grid state: exactly 81 cells, row-major order. */
  cells: Cell[];
  /** Whether this puzzle came from the bundled example set or was user-entered. */
  source: PuzzleSource;
  /** Set when `source === 'example'`; references the originating {@link ExamplePuzzle}. */
  exampleId?: string;
  /**
   * Derived lifecycle state.
   * MUST be `'invalid'` whenever any cell has `hasConflict === true` (FR-004);
   * "Solve All"/"Solve Next Digit" MUST be disabled while `status === 'invalid'`
   * (FR-011).
   */
  status: PuzzleStatus;
  /**
   * Index (0-80) of the cell most recently filled by "Solve Next Digit"
   * (US4, SC-003), so the board can briefly highlight it. `undefined` after
   * any other action (loading a puzzle, manual entry, "Solve All", reset).
   */
  lastFilledIndex?: number;
  /**
   * Index (0-80) of the single cell currently marked as selected (FR-013 /
   * US5), or `undefined` if no cell is selected. Managed by
   * `PuzzleStore.selectCell`; cleared whenever the puzzle is wholesale-
   * replaced (`loadRandomExample`, `loadExample`, `startCustomPuzzle`,
   * `reset`), and preserved unchanged across in-place mutations
   * (`setCellValue`, `solveAll`, `solveNextDigit`) — mirrors the lifecycle of
   * {@link Puzzle.lastFilledIndex}. May reference a cell with any `origin`,
   * including `'given'` (a given cell can be selected but not edited).
   */
  selectedIndex?: number;
}

/** Number of rows/columns/boxes on a classic sudoku grid. */
export const GRID_SIZE = 9;
/** Total number of cells on a classic sudoku grid. */
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;

/**
 * Builds a blank 81-cell {@link Puzzle} with the given `source`, with every
 * cell empty and no conflicts (used by `startCustomPuzzle` (FR-003) and as the
 * basis for seeding puzzles from `givens`).
 */
export function createBlankPuzzle(source: PuzzleSource, exampleId?: string): Puzzle {
  const cells: Cell[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      cells.push(createEmptyCell(row, col));
    }
  }
  return { cells, source, exampleId, status: 'unsolved' };
}

/**
 * Builds a {@link Puzzle} seeded from a flat `givens` array (0 = empty, 1-9 =
 * given digit, row-major, per data-model.md's `ExamplePuzzle.givens` shape).
 * Every non-zero entry becomes a `'given'` cell (Assumptions: given digits are
 * fixed).
 */
export function createPuzzleFromGivens(
  givens: readonly number[],
  source: PuzzleSource,
  exampleId?: string,
): Puzzle {
  if (givens.length !== CELL_COUNT) {
    throw new Error(`givens must have exactly ${CELL_COUNT} entries, got ${givens.length}`);
  }
  const cells: Cell[] = givens.map((digit, index) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const box = computeBox(row, col);
    return digit === 0
      ? { row, col, box, value: null, origin: 'empty', hasConflict: false }
      : { row, col, box, value: digit, origin: 'given', hasConflict: false };
  });
  return { cells, source, exampleId, status: 'unsolved' };
}
