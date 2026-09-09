# Phase 1 Data Model: Sudoku Solver

This model describes the in-memory (client-side) data shapes needed to satisfy
the functional requirements in `spec.md`. There is no backing database — all
state lives in Angular service/component state for the current browser session
(see `plan.md` Technical Context: Storage = N/A).

## Entities

### Cell

A single position on the 9x9 grid.

| Field | Type | Notes |
|---|---|---|
| `row` | integer (0-8) | Row index. |
| `col` | integer (0-8) | Column index. |
| `box` | integer (0-8) | Derived: `Math.floor(row/3)*3 + Math.floor(col/3)`. |
| `value` | integer (1-9) or empty | Current digit, or empty if unfilled. |
| `origin` | `'given' \| 'user-entered' \| 'solver-filled' \| 'empty'` | Tracks provenance so given digits vs. solved digits can be visually distinguished (FR-010) and given digits can be treated as fixed (Assumptions). |
| `hasConflict` | boolean | True when `value` duplicates another cell in the same row, column, or box; drives real-time validation highlighting (FR-004, Clarifications). |

**Validation rules**:
- `value`, if present, MUST be an integer 1-9 (classic sudoku digits only).
- A cell with `origin === 'given'` MUST NOT be edited by the user or overwritten
  by the solver (Assumptions).
- `hasConflict` is recomputed whenever any cell sharing the same row, column, or
  box changes value (FR-004).

### Puzzle

One 9x9 sudoku grid currently in play.

| Field | Type | Notes |
|---|---|---|
| `cells` | `Cell[81]` (9x9) | The full grid state. |
| `source` | `'example' \| 'custom'` | Whether the puzzle came from the bundled example set or was user-entered (FR-002, FR-003). |
| `exampleId` | string, optional | Set when `source === 'example'`; references the `ExamplePuzzle.id` it was loaded from. |
| `status` | `'invalid' \| 'unsolved' \| 'solving' \| 'solved' \| 'unsolvable'` | Derived state used to gate the solve actions (FR-011) and to detect/report unsolvable puzzles (FR-007). |
| `selectedIndex` | integer (0-80), optional | Index of the single cell currently marked as selected (FR-013 / US5), or `undefined` if none is selected. Managed by `PuzzleStore.selectCell`; cleared whenever the puzzle is wholesale-replaced (`loadRandomExample`, `loadExample`, `startCustomPuzzle`, `reset`), preserved across in-place mutations (`setCellValue`, `solveAll`, `solveNextDigit`) — mirrors the existing `lastFilledIndex` field's lifecycle. |

**State transitions**:

```text
(load example OR start custom) → unsolved
unsolved --[conflict introduced]--> invalid
invalid --[conflict resolved]--> unsolved
unsolved --[Solve All / Solve Next Digit found no solution]--> unsolvable
unsolved --[Solve Next Digit fills a cell, empties remain]--> unsolved
unsolved --[Solve All, or last empty cell filled via Solve Next Digit]--> solved
solved --[reset]--> unsolved (all non-given digits cleared)
any state --[select different example / start new custom]--> unsolved (new puzzle)
```

**Validation rules**:
- `status` MUST be `invalid` whenever any cell has `hasConflict === true`
  (FR-004); "Solve All" and "Solve Next Digit" MUST be disabled/blocked while
  `status === 'invalid'` (FR-011).
- `status` becomes `unsolvable` only after the solver has conclusively
  determined no valid assignment exists (FR-007); this MUST NOT block the UI
  thread while determining it (Constitution Principle IV; see `research.md`).
- When more than one valid solution exists for a `custom` puzzle, the solver
  commits to the first solution it finds; this does not change the data model,
  only which digits get written into `solver-filled` cells (Clarifications).
- At most one cell may be selected at a time: `selectedIndex`, when present,
  MUST reference exactly one valid cell index (0-80); selecting a different
  cell overwrites it rather than tracking a set (FR-013).
- "Reset" MUST clear every cell whose `origin !== 'given'` back to
  `{ value: null, origin: 'empty' }`, regardless of the current `status`
  (`invalid`, `unsolved`, `unsolvable`, or `solved`) and regardless of whether
  that cell's digit came from solving or from manual user entry (FR-009). For
  a `source === 'custom'` puzzle, no cell is ever `'given'`, so reset clears
  the entire grid.

### ExamplePuzzle

One curated, bundled classic sudoku puzzle available for selection (FR-002,
FR-012).

| Field | Type | Notes |
|---|---|---|
| `id` | string | Stable identifier within the bundled set. |
| `label` | string | Human-readable name/description shown in the picker. |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | Descriptive only; does not affect solving behavior (Assumptions). |
| `givens` | integer[81] (0 = empty, 1-9 = given digit) | The puzzle's starting digits, row-major order. |

**Validation rules**:
- The bundled set MUST contain at least 5 `ExamplePuzzle` entries spanning more
  than one `difficulty` value (FR-012, SC-006).
- Each `ExamplePuzzle.givens` MUST have exactly one valid classic sudoku
  solution (Assumptions) — verified once when the bundled set is authored/
  tested, not re-verified at runtime.

## Relationships

- A `Puzzle` is composed of 81 `Cell` entries (1 Puzzle : 81 Cells, embedded).
- A `Puzzle` with `source === 'example'` references exactly one `ExamplePuzzle`
  via `exampleId`, used to restore given digits on reset (FR-009, clearing any
  solver-filled or manually user-entered digits in other cells) or when the
  same example is re-selected (Edge Cases).
- `ExamplePuzzle` entries are independent of any `Puzzle` in play; selecting one
  creates a new `Puzzle` seeded from its `givens` (FR-002).
