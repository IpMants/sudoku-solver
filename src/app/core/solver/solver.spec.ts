import { SudokuSolverService } from './solver';

/**
 * Contract tests for {@link SudokuSolverService} (contracts/solver-service.md
 * "Contract test expectations"). Written before the implementation per
 * Constitution Principle III (Test-First Solver Correctness, NON-NEGOTIABLE).
 */
describe('SudokuSolverService', () => {
  let service: SudokuSolverService;

  beforeEach(() => {
    service = new SudokuSolverService();
  });

  /** Wikipedia's canonical "easy" example puzzle; known unique solution. */
  const uniquelySolvablePuzzle = [
    5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 0, 6,
    0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0,
    0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
  ];

  /**
   * The "easy-1" example puzzle with two of its given digits swapped (3 and 5
   * in row 0), which keeps it free of row/column/box duplicates but makes it
   * impossible to complete (verified offline with a backtracking solver).
   * Used to test FR-007's "no valid solution" handling independent of the
   * duplicate-conflict case already covered by the `findConflicts` tests.
   */
  const unsolvablePuzzle = [
    3, 5, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 0, 6,
    0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0,
    0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
  ];

  it('resolves the correct solution for a valid, uniquely-solvable puzzle', async () => {
    const result = await service.solveAll(uniquelySolvablePuzzle);
    expect(result.solvable).toBeTrue();
    expect(result.solution).toBeDefined();
    // Re-validate: the solution must be a complete, conflict-free grid.
    expect(result.solution!.every((v) => v >= 1 && v <= 9)).toBeTrue();
  });

  it('resolves solvable: false for an unsolvable puzzle without hanging', async () => {
    expect(service.findConflicts(unsolvablePuzzle)).toEqual([]);
    const result = await service.solveAll(unsolvablePuzzle);
    expect(result.solvable).toBeFalse();
  });

  it('resolves some valid solution for a puzzle with multiple valid solutions', async () => {
    // A blank grid has many valid solutions; any one is acceptable (Clarifications).
    const blank = new Array(81).fill(0);
    const result = await service.solveAll(blank);
    expect(result.solvable).toBeTrue();
    expect(result.solution).toBeDefined();
    expect(service.findConflicts(result.solution!)).toEqual([]);
  });

  it('resolves a single-cell puzzle (exactly one given digit) without conflicts', async () => {
    // Constitution III explicitly names "single-cell puzzles" as an edge case
    // to cover, distinct from the fully-blank and multi-solution cases above.
    const singleCell = new Array(81).fill(0);
    singleCell[0] = 5;
    expect(service.findConflicts(singleCell)).toEqual([]);
    const result = await service.solveAll(singleCell);
    expect(result.solvable).toBeTrue();
    expect(result.solution).toBeDefined();
    expect(result.solution![0]).toBe(5);
    expect(service.findConflicts(result.solution!)).toEqual([]);
  });

  it('resolves hadEmptyCell: false with no cellIndex/digit for an already-solved grid', async () => {
    const solveResult = await service.solveAll(uniquelySolvablePuzzle);
    const nextDigit = await service.solveNextDigit(solveResult.solution!);
    expect(nextDigit.hadEmptyCell).toBeFalse();
    expect(nextDigit.cellIndex).toBeUndefined();
    expect(nextDigit.digit).toBeUndefined();
  });

  it('fills exactly one additional correct digit via solveNextDigit', async () => {
    const before = uniquelySolvablePuzzle.slice();
    const result = await service.solveNextDigit(before);
    expect(result.hadEmptyCell).toBeTrue();
    expect(result.cellIndex).toBeDefined();
    expect(result.digit).toBeGreaterThanOrEqual(1);
    expect(result.digit).toBeLessThanOrEqual(9);
    // Original array must not be mutated by the service.
    expect(before).toEqual(uniquelySolvablePuzzle);
  });

  describe('findConflicts', () => {
    it('returns the conflicting cell indices for a grid with a rule conflict', () => {
      const grid = new Array(81).fill(0);
      grid[0] = 4;
      grid[1] = 4;
      const conflicts = service.findConflicts(grid);
      expect(conflicts.slice().sort((a, b) => a - b)).toEqual([0, 1]);
    });
  });
});
