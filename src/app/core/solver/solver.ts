import { Injectable } from '@angular/core';
import { findConflicts, Grid } from '../validator/validator';

export type { Grid };

/** Result of a full-grid solve attempt (contracts/solver-service.md). */
export interface SolveResult {
  /** True if a valid solution exists for the given puzzle. */
  solvable: boolean;
  /** The fully solved grid; only meaningful when `solvable` is true. */
  solution?: Grid;
}

/** Result of revealing exactly one more digit (contracts/solver-service.md). */
export interface NextDigitResult {
  /** True if a valid solution exists for the given puzzle. */
  solvable: boolean;
  /** True if there was at least one empty cell to fill. */
  hadEmptyCell: boolean;
  /** Index (0-80) of the cell that was filled; present only when a digit was filled. */
  cellIndex?: number;
  /** The digit filled into `cellIndex`; present only when a digit was filled. */
  digit?: number;
}

const GRID_SIZE = 9;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const BOX_SIZE = 3;
const ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Number of backtracking steps to perform between yielding control back to
 * the event loop (via a macrotask), so solving never blocks the UI thread
 * for a perceptible duration (Constitution Principle IV). This is the
 * "chunked async computation" alternative from research.md's Solver
 * Algorithm decision (as opposed to an actual Web Worker).
 */
const YIELD_EVERY_N_STEPS = 2000;

/**
 * Solves classic 9x9 sudoku puzzles (contracts/solver-service.md).
 *
 * Uses constraint-propagation-assisted backtracking: at each step, it picks
 * the empty cell with the fewest remaining candidate digits (the
 * "minimum remaining values" heuristic), which drastically prunes the search
 * tree compared to naive left-to-right backtracking and keeps even
 * hard/adversarial puzzles (e.g. Arto Inkala's 2012 puzzle) within the
 * performance budget (SC-002, SC-003).
 */
@Injectable({ providedIn: 'root' })
export class SudokuSolverService {
  /**
   * Validates a grid for classic sudoku rule conflicts. See
   * {@link findConflicts} for the full behavioral contract; re-exported here
   * so callers only need to depend on {@link SudokuSolverService}.
   */
  findConflicts(grid: Grid): number[] {
    return findConflicts(grid);
  }

  /**
   * Computes a full solution for the given grid (FR-005, FR-007). Resolves
   * without ever blocking the caller's UI thread for the duration of the
   * search (Constitution Principle IV). When multiple valid solutions exist,
   * returns the first one found (Clarifications).
   *
   * Precondition: `findConflicts(grid).length === 0`.
   */
  async solveAll(grid: Grid): Promise<SolveResult> {
    const solution = await backtrackSolve(grid);
    return solution ? { solvable: true, solution } : { solvable: false };
  }

  /**
   * Computes and returns exactly one additional correct digit for the given
   * grid (FR-006), consistent with the same solution {@link solveAll} would
   * produce for this grid. Does not mutate `grid`; caller applies the
   * returned digit.
   *
   * Precondition: `findConflicts(grid).length === 0`.
   */
  async solveNextDigit(grid: Grid): Promise<NextDigitResult> {
    const solution = await backtrackSolve(grid);
    if (!solution) {
      return { solvable: false, hadEmptyCell: false };
    }

    const emptyIndex = grid.findIndex((value) => value === 0);
    if (emptyIndex === -1) {
      return { solvable: true, hadEmptyCell: false };
    }

    return {
      solvable: true,
      hadEmptyCell: true,
      cellIndex: emptyIndex,
      digit: solution[emptyIndex],
    };
  }
}

/**
 * Runs MRV-heuristic backtracking search on a copy of `grid`, yielding to the
 * event loop every {@link YIELD_EVERY_N_STEPS} steps. Returns the solved grid,
 * or `null` if no valid completion exists. Never mutates the input `grid`.
 */
async function backtrackSolve(grid: Grid): Promise<Grid | null> {
  if (grid.length !== CELL_COUNT) {
    throw new Error(`grid must have exactly ${CELL_COUNT} entries, got ${grid.length}`);
  }

  const working = grid.slice();
  let stepCount = 0;

  async function maybeYield(): Promise<void> {
    stepCount++;
    if (stepCount % YIELD_EVERY_N_STEPS === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  async function search(): Promise<boolean> {
    await maybeYield();

    const next = findMostConstrainedCell(working);
    if (!next) {
      // No empty cells remain: the grid is fully (and validly) filled.
      return true;
    }
    if (next.candidates.length === 0) {
      // An empty cell has no legal digit: this branch is a dead end.
      return false;
    }

    for (const candidate of next.candidates) {
      working[next.index] = candidate;
      if (await search()) {
        return true;
      }
      working[next.index] = 0;
    }
    return false;
  }

  const solved = await search();
  return solved ? working : null;
}

/**
 * Finds the empty cell with the fewest legal candidate digits (the
 * "minimum remaining values" heuristic), or `null` if every cell is filled.
 */
function findMostConstrainedCell(
  grid: Grid,
): { index: number; candidates: number[] } | null {
  let best: { index: number; candidates: number[] } | null = null;

  for (let index = 0; index < grid.length; index++) {
    if (grid[index] !== 0) continue;

    const candidates = candidatesFor(grid, index);
    if (candidates.length === 0) {
      // Immediately return a dead-end cell so the caller can backtrack.
      return { index, candidates };
    }
    if (!best || candidates.length < best.candidates.length) {
      best = { index, candidates };
    }
  }

  return best;
}

/** Returns every digit 1-9 that would not conflict if placed at `index`. */
function candidatesFor(grid: Grid, index: number): number[] {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

  const used = new Set<number>();
  for (let i = 0; i < GRID_SIZE; i++) {
    used.add(grid[row * GRID_SIZE + i]);
    used.add(grid[i * GRID_SIZE + col]);
  }
  for (let r = 0; r < BOX_SIZE; r++) {
    for (let c = 0; c < BOX_SIZE; c++) {
      used.add(grid[(boxRow + r) * GRID_SIZE + (boxCol + c)]);
    }
  }

  return ALL_DIGITS.filter((digit) => !used.has(digit));
}
