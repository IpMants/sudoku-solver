import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { BoardComponent } from './features/board/board.component';
import { SolveControlsComponent } from './features/solve-controls/solve-controls.component';
import { ExamplePickerComponent } from './features/example-picker/example-picker.component';
import { DigitKeypadComponent } from './features/digit-keypad/digit-keypad.component';
import { PuzzleStore } from './core/state/puzzle-store';

/**
 * Root application shell. On startup (FR-001, SC-001), loads a random
 * bundled example puzzle with no user action and no login step, then hosts
 * the example picker, board, and solve-controls feature components. Also
 * hosts the "start custom puzzle" entry point (FR-003, US3), which presents
 * a blank 9x9 grid for manual entry, and the on-screen `DigitKeypadComponent`
 * (US2), which renders nothing (and takes no layout space) on non-compact
 * viewports or while no editable cell is selected.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    BoardComponent,
    SolveControlsComponent,
    ExamplePickerComponent,
    DigitKeypadComponent,
    MatButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Sudoku Solver';

  constructor(private readonly store: PuzzleStore) {}

  ngOnInit(): void {
    this.store.loadRandomExample();
  }

  /** Starts a blank custom puzzle for manual entry (FR-003, US3). */
  onStartCustomPuzzle(): void {
    this.store.startCustomPuzzle();
  }

  /**
   * Clears the current cell selection when the user taps/clicks on truly
   * "blank" page background — i.e. anywhere that is not the grid itself,
   * not the on-screen keypad, and not any button/link control (US2/AC5,
   * Edge Cases: "tap outside the grid... the keypad follows the newly
   * selected cell (or hides if no cell is selected)"). Deliberately does
   * NOT clear the selection on clicks that land on a button/link (e.g.
   * "Solve Next Digit", "Reset", an example-picker item), since
   * `PuzzleStore.selectCell`'s contract (FR-013 / US5, `001-sudoku-solver`)
   * already requires the selection to be preserved across those in-place
   * actions — only genuinely "outside" taps should dismiss it.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target) return;
    if (target.closest('.sudoku-grid, app-digit-keypad, button, a')) return;
    this.store.selectCell(null);
  }
}

