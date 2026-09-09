import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { BoardComponent } from './features/board/board.component';
import { SolveControlsComponent } from './features/solve-controls/solve-controls.component';
import { ExamplePickerComponent } from './features/example-picker/example-picker.component';
import { PuzzleStore } from './core/state/puzzle-store';

/**
 * Root application shell. On startup (FR-001, SC-001), loads a random
 * bundled example puzzle with no user action and no login step, then hosts
 * the example picker, board, and solve-controls feature components. Also
 * hosts the "start custom puzzle" entry point (FR-003, US3), which presents
 * a blank 9x9 grid for manual entry.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    BoardComponent,
    SolveControlsComponent,
    ExamplePickerComponent,
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
}
