# Contract: Puzzle Store Service & UI Actions

This contract defines the internal state/action surface used by the UI feature
components (`board`, `example-picker`, `solve-controls`) to load, edit, and
solve puzzles. As with `solver-service.md`, there is no network API — this is
the TypeScript service contract the components are built against, so features
can be developed and tested against a fake/mock implementation independent of
the real solver and the DOM.

## `ExamplePuzzleProvider`

```ts
import type { ExamplePuzzle } from '../data-model'; // see data-model.md

export interface ExamplePuzzleProvider {
  /** Returns the full bundled set of example puzzles (FR-002, FR-012). */
  getAll(): ExamplePuzzle[];

  /** Returns one uniformly-random example puzzle (FR-001). */
  getRandom(): ExamplePuzzle;

  /** Returns a specific example puzzle by id, or undefined if not found. */
  getById(id: string): ExamplePuzzle | undefined;
}
```

- MUST be synchronous (data is bundled, no live network call — Clarifications).
- `getAll().length` MUST be `>= 5` and MUST include more than one distinct
  `difficulty` value (FR-012, SC-006).

## `PuzzleStore`

Holds the single `Puzzle` currently in play (see `data-model.md`) and exposes
the actions the UI triggers.

```ts
export interface PuzzleStore {
  /** Current puzzle state, observable for the board/controls to render. */
  readonly puzzle$: Observable<Puzzle>;

  /** FR-001: called once on app start to load a random example puzzle. */
  loadRandomExample(): void;

  /** FR-002: replaces the board with the given example puzzle's given digits. */
  loadExample(exampleId: string): void;

  /** FR-003: replaces the board with a blank grid for manual entry. */
  startCustomPuzzle(): void;

  /**
   * FR-004: sets a single non-given cell's value (or clears it) during manual
   * entry, and re-runs conflict detection immediately.
   */
  setCellValue(cellIndex: number, value: number | null): void;

  /**
   * FR-005/FR-011: triggers the solver to fill every remaining cell.
   * MUST be a no-op (or rejected) while `puzzle.status === 'invalid'`.
   */
  solveAll(): Promise<void>;

  /**
   * FR-006/FR-011: triggers the solver to fill exactly one more cell.
   * MUST be a no-op (or rejected) while `puzzle.status === 'invalid'`.
   * MUST be a safe no-op when the puzzle is already `'solved'` (User Story 4,
   * Acceptance Scenario 3).
   */
  solveNextDigit(): Promise<void>;

  /**
   * FR-009: restores the current puzzle to its original starting state -
   * clears every cell that is not `origin === 'given'` back to empty. For an
   * example puzzle this keeps the original given digits and clears both
   * solver-filled and manually user-entered digits; for a custom puzzle
   * (which has no `'given'` cells) this clears the entire grid back to
   * empty.
   */
  reset(): void;

  /**
   * FR-013 (US5): marks the cell at `index` as the single currently
   * "selected" cell (or clears the selection when `index` is `null`), so the
   * UI can visibly indicate which cell the user is about to change. Does not
   * change any cell's value, origin, or conflict state.
   */
  selectCell(index: number | null): void;
}
```

### Behavioral guarantees

- Every action that changes the puzzle (`loadExample`, `startCustomPuzzle`,
  `setCellValue`, `solveAll`, `solveNextDigit`, `reset`) MUST leave `puzzle$`
  emitting a `Puzzle` whose `status` correctly reflects the state-transition
  rules in `data-model.md` (e.g., conflicts → `'invalid'`; no empty cells left
  → `'solved'`).
- `setCellValue` MUST reject/ignore attempts to modify a cell whose
  `origin === 'given'` (Assumptions in `spec.md`).
- `loadExample`/`loadRandomExample`/`startCustomPuzzle` MUST fully replace the
  puzzle (no leftover digits from the previous puzzle — Edge Cases in
  `spec.md`), including when re-selecting the currently displayed example
  (Edge Cases: resets to original given digits).
- `selectCell` MUST accept any cell index (0-80), including cells whose
  `origin === 'given'` (FR-013 permits selecting, but not editing, given
  cells).
- `loadRandomExample`, `loadExample`, `startCustomPuzzle`, and `reset` MUST
  clear any current selection (the newly published `Puzzle.selectedIndex` is
  `undefined`), per FR-013's Edge Cases.
- `setCellValue`, `solveAll`, and `solveNextDigit` MUST preserve the current
  `Puzzle.selectedIndex` unchanged in the `Puzzle` they publish (selecting a
  cell is independent of editing/solving it, and a solver-filled selected cell
  MUST remain marked as selected — FR-013's Edge Cases).

## UI action → requirement traceability

| UI action | Store method | Requirement(s) |
|---|---|---|
| App loads | `loadRandomExample()` | FR-001, SC-001 |
| User picks an example from the list | `loadExample(id)` | FR-002 |
| User starts entering their own puzzle | `startCustomPuzzle()` | FR-003 |
| User types/clears a digit in a cell | `setCellValue(index, value)` | FR-004, FR-010 |
| User clicks "Solve All" | `solveAll()` | FR-005, FR-007, FR-011, SC-002, SC-007 |
| User clicks "Solve Next Digit" | `solveNextDigit()` | FR-006, FR-007, FR-011, SC-003, SC-007 |
| User clicks "Reset" | `reset()` | FR-009 |
| User clicks/focuses a cell | `selectCell(index)` | FR-013 |
