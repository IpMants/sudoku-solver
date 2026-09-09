# Contract: Solver Service

There is no network API in this feature (Constitution Principle II — client-side
only, no backend). The "contract" here is the internal TypeScript service
interface that the UI (`features/board`, `features/solve-controls`) depends on,
so it can be implemented and unit-tested independently of the DOM (per the
constitution's Technology & Architecture Constraints and Principle III,
test-first).

## `SudokuSolverService`

```ts
/** A 9x9 grid of digits, 0 = empty, 1-9 = filled, in row-major order (81 entries). */
export type Grid = number[];

export interface SolveResult {
  /** True if a valid solution exists for the given puzzle. */
  solvable: boolean;
  /** The fully solved grid; only meaningful when `solvable` is true. */
  solution?: Grid;
}

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

export interface SudokuSolverService {
  /**
   * Validates a grid for classic sudoku rule conflicts (duplicate digit in a
   * row, column, or 3x3 box). Used for real-time validation (FR-004).
   * @returns the 0-80 indices of every cell currently in conflict with another.
   */
  findConflicts(grid: Grid): number[];

  /**
   * Computes a full solution for the given grid (FR-005, FR-007).
   * MUST run without blocking the caller's UI thread for the duration of the
   * search (Constitution Principle IV) — implemented via a Web Worker or
   * chunked async execution.
   * When multiple valid solutions exist, returns the first one found
   * (Clarifications).
   * Precondition: `findConflicts(grid).length === 0`.
   */
  solveAll(grid: Grid): Promise<SolveResult>;

  /**
   * Computes and returns exactly one additional correct digit for the given
   * grid (FR-006), consistent with the same solution `solveAll` would produce
   * for this grid. Does not mutate `grid`; caller applies the returned digit.
   * Precondition: `findConflicts(grid).length === 0`.
   */
  solveNextDigit(grid: Grid): Promise<NextDigitResult>;
}
```

### Behavioral guarantees

- `findConflicts` is synchronous and pure (no side effects), so it can run on
  every keystroke for real-time validation (FR-004) without performance
  concerns.
- `solveAll` and `solveNextDigit` are asynchronous; UI callers MUST treat the
  puzzle `status` as `'solving'` until the returned `Promise` resolves, per the
  `Puzzle` state transitions in `data-model.md`.
- Both solving methods MUST resolve `solvable: false` (never throw, hang, or
  crash) when no valid assignment exists, so the UI can implement FR-007 /
  SC-007 (clear "no solution" messaging).
- Calling either solving method on a grid with existing conflicts is a
  programming error the UI must prevent (FR-011); the service is not required
  to re-validate this itself but SHOULD be defensive (e.g., reject the promise)
  if it is ever called this way.

## Contract test expectations

Per Constitution Principle III (test-first, non-negotiable), unit tests for this
contract MUST be written before the implementation and MUST cover, at minimum:
- A valid, uniquely-solvable puzzle → `solveAll` returns the correct solution.
- A puzzle with no valid solution → `solveAll`/`solveNextDigit` resolve
  `solvable: false` without hanging.
- A puzzle with more than one valid solution → `solveAll` returns some valid
  solution (checked via `findConflicts` on the result, not exact digit
  equality).
- An already fully solved grid → `solveNextDigit` resolves
  `hadEmptyCell: false` and does not report a `cellIndex`/`digit`.
- A grid with a rule conflict → `findConflicts` returns the conflicting cell
  indices.
