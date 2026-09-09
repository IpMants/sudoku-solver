/**
 * Tracks where a cell's current digit came from, so the UI can distinguish
 * original puzzle digits from user or solver input (FR-010).
 *
 * - `'given'`: part of the original puzzle; immutable by the user or solver.
 * - `'user-entered'`: typed in manually while defining a custom puzzle (FR-003).
 * - `'solver-filled'`: filled in by the solver via "Solve All"/"Solve Next
 *   Digit" (FR-005, FR-006).
 * - `'empty'`: no digit currently present.
 */
export type CellOrigin = 'given' | 'user-entered' | 'solver-filled' | 'empty';

/**
 * A single position on the 9x9 sudoku grid (data-model.md: Cell).
 */
export interface Cell {
  /** Row index, 0-8. */
  row: number;
  /** Column index, 0-8. */
  col: number;
  /** Derived 3x3 box index, 0-8: `Math.floor(row/3)*3 + Math.floor(col/3)`. */
  box: number;
  /**
   * Current digit, an integer 1-9, or `null` when the cell is empty.
   * MUST be an integer 1-9 when present (classic sudoku digits only).
   */
  value: number | null;
  /** Provenance of {@link value}; see {@link CellOrigin}. */
  origin: CellOrigin;
  /**
   * True when {@link value} duplicates another cell in the same row, column,
   * or box. Recomputed whenever any cell sharing the same row, column, or box
   * changes value (FR-004). Drives real-time conflict highlighting.
   */
  hasConflict: boolean;
}

/**
 * Computes the 3x3 box index for a given row/column, per data-model.md's
 * derivation rule: `Math.floor(row/3)*3 + Math.floor(col/3)`.
 */
export function computeBox(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

/**
 * Creates a new {@link Cell} at the given row/column with no value.
 */
export function createEmptyCell(row: number, col: number): Cell {
  return {
    row,
    col,
    box: computeBox(row, col),
    value: null,
    origin: 'empty',
    hasConflict: false,
  };
}
