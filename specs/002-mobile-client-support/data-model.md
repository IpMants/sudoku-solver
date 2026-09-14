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
| `targetCellIndex` | integer (0-80), optional | Mirrors `Puzzle.selectedIndex` for the currently selected **non-given** cell; `undefined` when no non-given cell is selected, or when the selected cell is `given`. Determines the keypad's *interactive* (vs. dimmed/disabled) state — not its visibility (revised 2026-09-14: the keypad's rendering no longer depends on this field, only its interactivity does). |

**Validation rules**:
- The keypad MUST render (i.e., be present, non-`aria-hidden`, and occupy
  layout space) whenever `isCompactViewport === true`, regardless of
  `targetCellIndex` (2026-09-14 clarification: the alternative entry method
  must always be visible on mobile).
- The keypad MUST be interactive (buttons not `disabled`, no dimmed style)
  only when `targetCellIndex` is defined AND the cell at `targetCellIndex`
  has `origin !== 'given'`; otherwise every button MUST be `disabled` and
  visually dimmed, while remaining present in the accessibility tree.
- Tapping a digit button (1-9) MUST call `PuzzleStore.setCellValue
  (targetCellIndex, digit)`; tapping "Clear" MUST call
  `PuzzleStore.setCellValue(targetCellIndex, null)`. Neither action reads or
  writes any field beyond what `setCellValue` already validates
  (`data-model.md`'s existing rule that `given` cells reject edits). Both
  MUST be no-ops (unreachable, since the buttons are `disabled`) when
  `targetCellIndex` is undefined.
- No new `Puzzle` or `Cell` state transition is introduced; all transitions
  remain exactly as documented in `specs/001-sudoku-solver/data-model.md`.

## Relationships

- `DigitKeypadComponent` is a pure consumer of `PuzzleStore.puzzle$`
  (read: `selectedIndex`, cell `origin`) and a pure caller of
  `PuzzleStore.setCellValue` (write) — it introduces no new relationship
  between existing entities and holds no state that outlives a single
  viewport/selection change.
