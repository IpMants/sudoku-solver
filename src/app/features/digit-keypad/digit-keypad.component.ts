import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { PuzzleStore } from '../../core/state/puzzle-store';
import { Puzzle } from '../../core/models/puzzle';
import { ViewportService } from '../../core/state/viewport.service';

/**
 * View-model consumed by the template: whether the keypad should currently
 * be shown/interactive, and (when shown) which cell index taps apply to.
 * Purely transient UI state (data-model.md: no new persisted entity is
 * introduced by this component).
 */
interface KeypadViewState {
  visible: boolean;
  targetCellIndex: number | null;
}

/**
 * On-screen touch keypad for entering sudoku digits on compact (mobile)
 * viewports, per contracts/digit-keypad.md and spec.md User Story 2 (FR-002,
 * FR-003, FR-003b, FR-004, FR-006, FR-010). Appears only when the viewport is
 * "compact" ({@link ViewportService.isCompactViewport$}) AND a non-`given`
 * cell is currently selected ({@link PuzzleStore.puzzle$}'s `selectedIndex`).
 *
 * Deliberately introduces no changes to `PuzzleStore`: every tap forwards to
 * the existing {@link PuzzleStore.setCellValue}, the same method
 * `BoardComponent.onGridKeydown` already uses for physical/paired-keyboard
 * entry (FR-003a), so both input paths stay in sync automatically.
 *
 * Buttons deliberately use plain `<button>` elements rather than
 * `MatButtonModule` (plan.md's Technical Context originally named
 * `MatButtonModule` as the candidate dependency for keypad buttons): a
 * uniform, exactly-44x44px touch-target grid is simpler and more
 * predictable to guarantee with plain buttons than with Angular Material's
 * button component, whose host classes/ripple wrapper add their own
 * min-width/padding that would need overriding via `::ng-deep` (as already
 * done for `solve-controls`/`example-picker` in T007/T021-T023) for every
 * button in a ten-button grid. This keeps `digit-keypad.component.scss`
 * (T012/T015) simple while still satisfying the same accessibility/touch-
 * target requirements (FR-003, Clarifications) that `MatButtonModule` would
 * have provided.
 */
@Component({
  selector: 'app-digit-keypad',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf],
  templateUrl: './digit-keypad.component.html',
  styleUrl: './digit-keypad.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
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
   * Combines {@link puzzle$} and {@link isCompactViewport$} into the single
   * view state the template renders from: visible only when the viewport is
   * compact AND the selected cell (if any) is editable (`origin !==
   * 'given'`) (FR-002, FR-003; Key Entities: On-Screen Keypad).
   */
  readonly viewState$: Observable<KeypadViewState>;

  /** The digits 1-9, rendered as one button each. */
  readonly digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor(
    private readonly store: PuzzleStore,
    private readonly viewport: ViewportService,
  ) {
    this.puzzle$ = this.store.puzzle$;
    this.isCompactViewport$ = this.viewport.isCompactViewport$;
    this.viewState$ = combineLatest([this.puzzle$, this.isCompactViewport$]).pipe(
      map(([puzzle, isCompact]) => this.deriveViewState(puzzle, isCompact)),
    );
  }

  /**
   * Handles a tap on digit button `digit` (1-9): forwards to
   * {@link PuzzleStore.setCellValue} for the currently selected non-given
   * cell. No-op if no non-given cell is selected (FR-004, FR-010).
   */
  onDigitTap(digit: number, targetCellIndex: number | null): void {
    if (targetCellIndex === null) return;
    this.store.setCellValue(targetCellIndex, digit);
  }

  /**
   * Handles a tap on the "Clear" button: forwards to
   * {@link PuzzleStore.setCellValue} with `null`. No-op if no non-given cell
   * is selected (FR-004).
   */
  onClearTap(targetCellIndex: number | null): void {
    if (targetCellIndex === null) return;
    this.store.setCellValue(targetCellIndex, null);
  }

  /** Angular `trackBy` for the digit-button `*ngFor`. */
  trackByDigit(_index: number, digit: number): number {
    return digit;
  }

  /**
   * Derives the {@link KeypadViewState} from the latest puzzle/viewport
   * snapshots: the keypad is only visible on a compact viewport while a
   * cell whose `origin !== 'given'` is selected (FR-002, FR-003).
   */
  private deriveViewState(puzzle: Puzzle, isCompact: boolean): KeypadViewState {
    const selectedIndex = puzzle.selectedIndex;
    const selectedCell = selectedIndex !== undefined ? puzzle.cells[selectedIndex] : undefined;
    const isEditable = !!selectedCell && selectedCell.origin !== 'given';
    return {
      visible: isCompact && isEditable,
      targetCellIndex: isCompact && isEditable ? selectedIndex! : null,
    };
  }
}
