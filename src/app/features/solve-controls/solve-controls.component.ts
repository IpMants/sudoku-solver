import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { PuzzleStore } from '../../core/state/puzzle-store';
import { Puzzle } from '../../core/models/puzzle';

/**
 * Provides the "Solve All" (FR-005) and "Solve Next Digit" (FR-006) actions,
 * plus (added in later phases) "Reset" (FR-009). Shows a "solving" loading
 * indicator while a solve action is in flight and disables the buttons
 * during that time, and disables both solve actions while the puzzle is
 * `invalid` (FR-011).
 */
@Component({
  selector: 'app-solve-controls',
  standalone: true,
  imports: [AsyncPipe, NgIf, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './solve-controls.component.html',
  styleUrl: './solve-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolveControlsComponent {
  /** The puzzle currently in play, used to derive button disabled/loading state. */
  readonly puzzle$: Observable<Puzzle>;

  constructor(private readonly store: PuzzleStore) {
    this.puzzle$ = this.store.puzzle$;
  }

  /** Invokes {@link PuzzleStore.solveAll}. */
  onSolveAll(): void {
    void this.store.solveAll();
  }

  /** Invokes {@link PuzzleStore.solveNextDigit} (FR-006, US4). */
  onSolveNextDigit(): void {
    void this.store.solveNextDigit();
  }

  /** Invokes {@link PuzzleStore.reset}, restoring the puzzle's original given digits (FR-009, US3). */
  onReset(): void {
    this.store.reset();
  }
}
