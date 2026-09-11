# Phase 1 Data Model: Mobile Client Support

This feature introduces **no new persisted entities or data-model fields**.
It reuses the `Cell` / `Puzzle` / `ExamplePuzzle` entities and the
`Puzzle.selectedIndex` field exactly as defined in
`specs/001-sudoku-solver/data-model.md`. The only additions are transient,
presentation-only UI state that lives in the new `DigitKeypadComponent` (not
in `PuzzleStore`, and not serialized/persisted anywhere).

## Reused entities (unchanged)

See `specs/001-sudoku-solver/data-model.md` for full definitions:

- **Cell** — `row`, `col`, `box`, `value`, `origin`, `hasConflict`. The
  keypad only ever acts on the currently selected `Cell` (via its index) and
  never reads/writes any field not already covered by `PuzzleStore
  .setCellValue`.
- **Puzzle** — in particular `selectedIndex` (set by `PuzzleStore.selectCell`,
  already cleared on puzzle replacement and preserved across in-place
  mutations per the existing state-transition rules). The keypad's visibility
  is entirely derived from `puzzle.selectedIndex` plus the current viewport
  breakpoint — no new field is needed to track "is the keypad open."
- **ExamplePuzzle** — unaffected; unchanged.

## New transient UI state (component-local, not part of the domain model)

### `DigitKeypadComponent` view state

| Field | Type | Notes |
|---|---|---|
| `isCompactViewport` | boolean | Derived from a CSS breakpoint match (media query or `BreakpointObserver`); determines whether the keypad renders at all (research.md: CSS-breakpoint decision, not user-agent sniffing). Not persisted; recomputed on resize/orientation change. |
| `targetCellIndex` | integer (0-80), optional | Mirrors `Puzzle.selectedIndex` for the currently selected **non-given** cell; `undefined` when no non-given cell is selected (keypad hidden) or when the selected cell is `given` (keypad hidden — given cells are not editable, matching `PuzzleStore.setCellValue`'s existing rejection of edits to `given` cells). |

**Validation rules**:
- The keypad MUST render only when `isCompactViewport === true` AND
  `targetCellIndex` is defined AND the cell at `targetCellIndex` has
  `origin !== 'given'`.
- Tapping a digit button (1-9) MUST call `PuzzleStore.setCellValue
  (targetCellIndex, digit)`; tapping "Clear" MUST call
  `PuzzleStore.setCellValue(targetCellIndex, null)`. Neither action reads or
  writes any field beyond what `setCellValue` already validates
  (`data-model.md`'s existing rule that `given` cells reject edits).
- No new `Puzzle` or `Cell` state transition is introduced; all transitions
  remain exactly as documented in `specs/001-sudoku-solver/data-model.md`.

## Relationships

- `DigitKeypadComponent` is a pure consumer of `PuzzleStore.puzzle$`
  (read: `selectedIndex`, cell `origin`) and a pure caller of
  `PuzzleStore.setCellValue` (write) — it introduces no new relationship
  between existing entities and holds no state that outlives a single
  viewport/selection change.
