import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ExamplePuzzle } from '../../core/models/example-puzzle';
import { ExamplePuzzleProvider } from '../../core/data/example-puzzle-provider';
import { PuzzleStore } from '../../core/state/puzzle-store';

/**
 * Lists every bundled example puzzle (FR-002, FR-012) and lets the user pick
 * one to load onto the board via {@link PuzzleStore.loadExample}.
 *
 * Re-selecting the currently displayed example resets it to its original
 * given digits, because `PuzzleStore.loadExample` always rebuilds a fresh
 * `Puzzle` from the example's `givens` (spec.md User Story 2 Edge Cases;
 * contracts/puzzle-store.md).
 */
@Component({
  selector: 'app-example-picker',
  standalone: true,
  imports: [MatListModule],
  templateUrl: './example-picker.component.html',
  styleUrl: './example-picker.component.scss',
})
export class ExamplePickerComponent {
  /** Every bundled example puzzle, in the order they ship in `examples.json`. */
  readonly examples: ExamplePuzzle[];

  constructor(
    private readonly provider: ExamplePuzzleProvider,
    private readonly store: PuzzleStore,
  ) {
    this.examples = this.provider.getAll();
  }

  /** Loads the chosen example puzzle onto the board, replacing any current progress (FR-002). */
  select(example: ExamplePuzzle): void {
    this.store.loadExample(example.id);
  }
}
