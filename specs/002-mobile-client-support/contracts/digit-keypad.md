# Contract: Digit Keypad Component (Mobile Touch Entry)

This contract defines the internal Angular component interface for the new
touch on-screen keypad. There is no network API — as with
`specs/001-sudoku-solver/contracts/*.md`, this is the TypeScript/template
contract the component is built against, and it deliberately introduces **no
changes** to the existing `PuzzleStore`/`ExamplePuzzleProvider` contracts
documented there.

## `DigitKeypadComponent`

```ts
import type { Observable } from 'rxjs';
import type { Puzzle } from '../../core/models/puzzle'; // see 001 data-model.md

@Component({ selector: 'app-digit-keypad', /* ... */ })
export class DigitKeypadComponent {
  /** Current puzzle, used to derive visibility and the target cell (FR-003). */
  readonly puzzle$: Observable<Puzzle>;

  /**
   * True when the viewport matches the "compact" breakpoint used to decide
   * whether the on-screen keypad should render at all (research.md:
   * CSS-breakpoint decision). Desktop-width viewports never render the
   * keypad, even if a cell is selected, since the physical keyboard path
   * (FR-003a) already works there.
   */
  readonly isCompactViewport$: Observable<boolean>;

  /**
   * Handles a tap on digit button `digit` (1-9): forwards to
   * `PuzzleStore.setCellValue(targetCellIndex, digit)` for the currently
   * selected non-given cell. No-op if no non-given cell is selected.
   */
  onDigitTap(digit: number): void;

  /**
   * Handles a tap on the "Clear" button: forwards to
   * `PuzzleStore.setCellValue(targetCellIndex, null)`. No-op if no
   * non-given cell is selected.
   */
  onClearTap(): void;
}
```

### Behavioral guarantees

- MUST render (be visible / not `aria-hidden`) only when
  `isCompactViewport$` emits `true` AND `puzzle.selectedIndex` references a
  cell whose `origin !== 'given'` (FR-003, FR-002; Key Entities: On-Screen
  Keypad).
- MUST NOT trigger the device's native virtual keyboard by any means (no
  hidden `<input>` focus, no `inputmode` attribute that summons a system
  keyboard) — satisfies the Edge Case "must not rely on the device's native
  virtual keyboard for digit entry."
- MUST call `PuzzleStore.setCellValue` synchronously on tap (no debounce that
  would delay entry beyond what `PuzzleStore` itself introduces), matching
  FR-004 and FR-010 (reliable registration of rapid sequential taps).
- MUST NOT introduce any new `PuzzleStore` method, new `Puzzle`/`Cell` field,
  or new state-transition rule beyond `specs/001-sudoku-solver/data-model.md`
  and `contracts/puzzle-store.md` — it is purely a new caller of the existing
  `selectCell`/`setCellValue` contract (see `research.md`'s first decision).
- Each button (digits 1-9 and Clear) MUST expose an `aria-label` (`"Enter N"` /
  `"Clear cell"`) and a tappable target of at least 44x44 CSS pixels
  (FR-003, FR-003b, Clarifications).
- MUST leave physical/paired-keyboard entry via `BoardComponent
  .onGridKeydown` completely unaffected — this component only adds a new
  input path, it does not replace or intercept the existing one (FR-003a).

## UI action → requirement traceability

| UI action | Component method | Store method invoked | Requirement(s) |
|---|---|---|---|
| User selects a non-given cell on a compact viewport | *(reactive to `puzzle$`/`isCompactViewport$`)* | *(none — keypad appears)* | FR-002, FR-003, FR-005 |
| User taps a digit (1-9) on the keypad | `onDigitTap(digit)` | `setCellValue(targetCellIndex, digit)` | FR-004, FR-006, FR-010 |
| User taps "Clear" on the keypad | `onClearTap()` | `setCellValue(targetCellIndex, null)` | FR-004 |
| User selects a different cell / deselects | *(reactive)* | *(none — keypad follows or hides)* | FR-005; Edge Cases |
| User types on a physical/paired keyboard on mobile | *(unaffected — `BoardComponent.onGridKeydown`)* | `setCellValue` | FR-003a |
