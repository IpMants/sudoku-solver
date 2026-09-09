import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Observable, Subscription, pairwise, startWith } from 'rxjs';
import { PuzzleStore } from '../../core/state/puzzle-store';
import { Puzzle } from '../../core/models/puzzle';

/**
 * Renders the 9x9 sudoku grid from {@link PuzzleStore.puzzle$}, visually
 * distinguishing `given` cells from `solver-filled`/`user-entered` cells
 * (FR-010), and shows a clear "no solution exists" message when the puzzle
 * is `unsolvable` (FR-007, SC-007).
 *
 * Also provides baseline keyboard navigation (arrow keys between cells) and
 * ARIA grid semantics (`role="grid"`/`"row"`/`"gridcell"`), satisfying
 * Constitution Principle V for the MVP (T019) — see plan.md's "MVP scope
 * note" and research.md's Accessibility decision. Editable cell input for
 * custom puzzles (FR-003/FR-004) is added on top of this in User Story 3.
 * An ARIA live region (T035) announces solve-fill and conflict-state
 * changes for screen reader users beyond that MVP baseline.
 */
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [AsyncPipe, NgClass, NgFor, NgIf],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnDestroy {
  /** The puzzle currently in play, rendered via the `async` pipe. */
  readonly puzzle$: Observable<Puzzle>;

  /** Index (0-80) of the cell that currently has roving `tabindex="0"` / focus, for keyboard grid navigation. */
  focusedIndex = 0;

  /**
   * Latest message for the `aria-live="polite"` status region (T035),
   * announcing solve-fill and conflict-state changes to screen reader
   * users. Empty string renders nothing.
   */
  liveMessage = '';

  private readonly subscription: Subscription;

  constructor(private readonly store: PuzzleStore) {
    this.puzzle$ = this.store.puzzle$;
    this.subscription = this.puzzle$
      .pipe(startWith(undefined), pairwise())
      .subscribe(([previous, current]) => this.announceChanges(previous, current as Puzzle));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Compares the previous and current puzzle snapshots and updates
   * {@link liveMessage} so assistive technology announces solve-fill
   * events and conflict-state transitions (Constitution Principle V).
   */
  private announceChanges(previous: Puzzle | undefined, current: Puzzle): void {
    if (
      current.lastFilledIndex !== undefined &&
      current.lastFilledIndex !== previous?.lastFilledIndex
    ) {
      const cell = current.cells[current.lastFilledIndex];
      this.liveMessage = `Filled row ${cell.row + 1}, column ${cell.col + 1} with ${cell.value}.`;
      return;
    }
    if (current.status === 'unsolvable' && previous?.status !== 'unsolvable') {
      this.liveMessage = 'No solution exists for this puzzle.';
      return;
    }
    if (current.status === 'solved' && previous?.status !== 'solved') {
      this.liveMessage = 'Puzzle solved.';
      return;
    }
    const hadConflict = previous?.cells.some((c) => c.hasConflict) ?? false;
    const hasConflict = current.cells.some((c) => c.hasConflict);
    if (hasConflict && !hadConflict) {
      this.liveMessage = 'Conflicting digit entered.';
    } else if (!hasConflict && hadConflict) {
      this.liveMessage = 'Conflict resolved.';
    }
  }

  /**
   * Handles arrow-key navigation across the 9x9 grid (roving tabindex
   * pattern): moves {@link focusedIndex} by one row/column per key press,
   * clamped to the grid bounds, and focuses the corresponding cell element.
   * Also handles digit entry ("1"-"9") and clearing ("Backspace"/"Delete"/
   * "0") on the focused cell for custom puzzles (FR-003/FR-004, US3);
   * {@link PuzzleStore.setCellValue} itself ignores attempts to edit a
   * `given` cell, so no extra guard is needed here.
   */
  onGridKeydown(event: KeyboardEvent): void {
    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      this.store.setCellValue(this.focusedIndex, Number(event.key));
      return;
    }
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      event.preventDefault();
      this.store.setCellValue(this.focusedIndex, null);
      return;
    }

    const row = Math.floor(this.focusedIndex / 9);
    const col = this.focusedIndex % 9;
    let nextRow = row;
    let nextCol = col;

    switch (event.key) {
      case 'ArrowUp':
        nextRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        nextRow = Math.min(8, row + 1);
        break;
      case 'ArrowLeft':
        nextCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        nextCol = Math.min(8, col + 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    this.focusCell(nextRow * 9 + nextCol);
  }

  /** Updates {@link focusedIndex} and moves DOM focus to the corresponding cell button. */
  focusCell(index: number): void {
    this.focusedIndex = index;
    const el = document.getElementById(this.cellElementId(index));
    el?.focus();
  }

  /**
   * Marks the cell at `index` as selected (FR-013 / US5), and updates
   * {@link focusedIndex} to match, so a mouse click and a keyboard-driven
   * focus change are both reflected consistently in `PuzzleStore` and in
   * the roving-tabindex state. Selecting a `given` cell is allowed (only
   * editing it is rejected, by {@link PuzzleStore.setCellValue}).
   */
  selectCell(index: number): void {
    this.focusedIndex = index;
    this.store.selectCell(index);
  }

  /** Stable DOM id for the cell at `index`, used for roving-tabindex focus management. */
  cellElementId(index: number): string {
    return `sudoku-cell-${index}`;
  }

  /** Angular `trackBy` for the cell `*ngFor`, keyed by row-major index. */
  trackByIndex(index: number): number {
    return index;
  }
}
