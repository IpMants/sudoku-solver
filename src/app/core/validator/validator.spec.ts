import { findConflicts } from './validator';

/**
 * Contract tests for the conflict validator (contracts/solver-service.md:
 * `findConflicts`). Written before the implementation per Constitution
 * Principle III (Test-First Solver Correctness, NON-NEGOTIABLE).
 */
describe('findConflicts', () => {
  /** A known valid, fully solved classic sudoku grid (no conflicts). */
  const solvedValidGrid = [
    5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6,
    1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2,
    8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
  ];

  it('returns no conflicts for a valid grid', () => {
    expect(findConflicts(solvedValidGrid)).toEqual([]);
  });

  it('detects a duplicate digit in the same row', () => {
    const grid = solvedValidGrid.slice();
    grid[1] = grid[0]; // duplicate 5 in row 0 (indices 0 and 1)
    const conflicts = findConflicts(grid);
    expect(conflicts).toContain(0);
    expect(conflicts).toContain(1);
  });

  it('detects a duplicate digit in the same column', () => {
    const grid = solvedValidGrid.slice();
    grid[9] = grid[0]; // row 1, col 0 duplicates row 0, col 0
    const conflicts = findConflicts(grid);
    expect(conflicts).toContain(0);
    expect(conflicts).toContain(9);
  });

  it('detects a duplicate digit in the same 3x3 box', () => {
    const grid = solvedValidGrid.slice();
    grid[10] = grid[0]; // row 1, col 1 is in the same box as row 0, col 0
    const conflicts = findConflicts(grid);
    expect(conflicts).toContain(0);
    expect(conflicts).toContain(10);
  });

  it('ignores empty cells (0) when checking for conflicts', () => {
    const grid = solvedValidGrid.slice();
    grid[0] = 0;
    grid[1] = 0;
    expect(findConflicts(grid)).toEqual([]);
  });

  it('returns the exact 0-80 indices of every conflicting cell', () => {
    const grid = new Array(81).fill(0);
    grid[0] = 7;
    grid[1] = 7; // same row conflict
    const conflicts = findConflicts(grid).slice().sort((a, b) => a - b);
    expect(conflicts).toEqual([0, 1]);
  });

  it('returns no conflicts for a single-cell puzzle (exactly one given digit)', () => {
    // Constitution III explicitly names "single-cell puzzles" as an edge case
    // to cover, distinct from the empty-board and multi-conflict cases above.
    const grid = new Array(81).fill(0);
    grid[40] = 9;
    expect(findConflicts(grid)).toEqual([]);
  });
});
