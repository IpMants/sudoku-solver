import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cell } from '../models/cell';
import {
  createBlankPuzzle,
  createPuzzleFromGivens,
  Puzzle,
  PuzzleStatus,
} from '../models/puzzle';
import { ExamplePuzzleProvider } from '../data/example-puzzle-provider';
import { SudokuSolverService } from '../solver/solver';

/**
 * Holds the single {@link Puzzle} currently in play and exposes the actions
 * the UI triggers (contracts/puzzle-store.md: `PuzzleStore`). This is the
 * single source of truth shared by `features/board`, `features/
 * example-picker`, and `features/solve-controls`.
 */
@Injectable({ providedIn: 'root' })
export class PuzzleStore {
  private readonly puzzleSubject = new BehaviorSubject<Puzzle>(createBlankPuzzle('custom'));

  /** Current puzzle state, observable for the board/controls to render. */
  readonly puzzle$: Observable<Puzzle> = this.puzzleSubject.asObservable();

  constructor(
    private readonly examples: ExamplePuzzleProvider,
    private readonly solver: SudokuSolverService,
  ) {}

  /** Synchronous snapshot of the current puzzle, for callers that need it outside the stream. */
  private get puzzle(): Puzzle {
    return this.puzzleSubject.value;
  }

  /**
   * FR-001: called once on app start to load a random example puzzle.
   * Publishes a fresh {@link Puzzle} with no selection (FR-013 / US5).
   */
  loadRandomExample(): void {
    const example = this.examples.getRandom();
    this.publish(createPuzzleFromGivens(example.givens, 'example', example.id));
  }

  /**
   * FR-002: replaces the board with the given example puzzle's given digits.
   * Re-selecting the currently displayed example resets it to its original
   * given digits, since a fresh {@link Puzzle} is always built from the
   * example's `givens` (Edge Cases). The fresh `Puzzle` has no selection
   * (FR-013 / US5's Edge Cases).
   */
  loadExample(exampleId: string): void {
    const example = this.examples.getById(exampleId);
    if (!example) return;
    this.publish(createPuzzleFromGivens(example.givens, 'example', example.id));
  }

  /**
   * FR-003: replaces the board with a blank grid for manual entry, with no
   * selection (FR-013 / US5's Edge Cases).
   */
  startCustomPuzzle(): void {
    this.publish(createBlankPuzzle('custom'));
  }

  /**
   * FR-013 (US5): marks the cell at `index` as the single currently
   * "selected" cell, or clears the selection when `index` is `null`.
   * Accepts any valid cell index (0-80), including cells whose
   * `origin === 'given'` (a given cell can be selected but not edited).
   * Does not change any cell's value, origin, or conflict state.
   */
  selectCell(index: number | null): void {
    const current = this.puzzle;
    if (index !== null && (index < 0 || index >= current.cells.length)) return;
    this.publish({ ...current, selectedIndex: index ?? undefined });
  }

  /**
   * FR-004: sets a single non-given cell's value (or clears it) during manual
   * entry, and re-runs conflict detection immediately. Rejects/ignores
   * attempts to modify a cell whose `origin === 'given'`. Preserves the
   * current `selectedIndex` unchanged (FR-013 / US5) — editing a cell's
   * value is independent of which cell is selected.
   */
  setCellValue(cellIndex: number, value: number | null): void {
    const current = this.puzzle;
    const cell = current.cells[cellIndex];
    if (!cell || cell.origin === 'given') return;

    const cells = this.recomputeConflicts([
      ...current.cells.slice(0, cellIndex),
      { ...cell, value, origin: value === null ? 'empty' : 'user-entered' },
      ...current.cells.slice(cellIndex + 1),
    ]);
    const hasConflict = cells.some((c) => c.hasConflict);
    this.publish({
      ...current,
      cells,
      status: deriveBasicStatus(cells, hasConflict),
      lastFilledIndex: undefined,
    });
  }

  /**
   * FR-005/FR-011: triggers the solver to fill every remaining cell. A no-op
   * while `puzzle.status === 'invalid'`. Preserves the current
   * `selectedIndex` unchanged (FR-013 / US5) — if the selected cell gets
   * solver-filled, it remains marked as selected afterward.
   */
  async solveAll(): Promise<void> {
    const current = this.puzzle;
    if (current.status === 'invalid' || current.status === 'solving') return;

    this.publish({ ...current, status: 'solving', lastFilledIndex: undefined });
    const result = await this.solver.solveAll(toGrid(current.cells));

    if (!result.solvable || !result.solution) {
      this.publish({ ...current, status: 'unsolvable' });
      return;
    }

    const cells = current.cells.map((cell, index) =>
      cell.origin === 'given'
        ? cell
        : { ...cell, value: result.solution![index], origin: 'solver-filled' as const },
    );
    this.publish({ ...current, cells, status: 'solved' });
  }

  /**
   * FR-006/FR-011: triggers the solver to fill exactly one more cell. A
   * no-op while `puzzle.status === 'invalid'`, and a safe no-op when the
   * puzzle is already `'solved'` (User Story 4, Acceptance Scenario 3).
   * Preserves the current `selectedIndex` unchanged (FR-013 / US5).
   */
  async solveNextDigit(): Promise<void> {
    const current = this.puzzle;
    if (current.status === 'invalid' || current.status === 'solving') return;
    if (current.status === 'solved') return;

    this.publish({ ...current, status: 'solving', lastFilledIndex: undefined });
    const result = await this.solver.solveNextDigit(toGrid(current.cells));

    if (!result.solvable) {
      this.publish({ ...current, status: 'unsolvable' });
      return;
    }
    if (!result.hadEmptyCell || result.cellIndex === undefined || result.digit === undefined) {
      this.publish({ ...current, status: 'solved' });
      return;
    }

    const cells = current.cells.slice();
    cells[result.cellIndex] = {
      ...cells[result.cellIndex],
      value: result.digit,
      origin: 'solver-filled',
    };
    const stillHasEmpty = cells.some((cell) => cell.value === null);
    this.publish({
      ...current,
      cells,
      status: stillHasEmpty ? 'unsolved' : 'solved',
      lastFilledIndex: result.cellIndex,
    });
  }

  /**
   * FR-009: restores the current puzzle to its original given digits,
   * discarding solver-filled digits. Also clears any current selection
   * (FR-013 / US5's Edge Cases), since resetting counts as changing the
   * displayed puzzle.
   */
  reset(): void {
    const current = this.puzzle;
    const cells = this.recomputeConflicts(
      current.cells.map((cell) =>
        cell.origin === 'solver-filled' ? { ...cell, value: null, origin: 'empty' as const } : cell,
      ),
    );
    const hasConflict = cells.some((c) => c.hasConflict);
    this.publish({
      ...current,
      cells,
      status: deriveBasicStatus(cells, hasConflict),
      lastFilledIndex: undefined,
      selectedIndex: undefined,
    });
  }

  /** Publishes a new puzzle snapshot to every subscriber of {@link puzzle$}. */
  private publish(puzzle: Puzzle): void {
    this.puzzleSubject.next(puzzle);
  }

  /**
   * Recomputes `hasConflict` for every cell and derives the resulting
   * `status`, per data-model.md's Puzzle validation rules: `status` MUST be
   * `'invalid'` whenever any cell has `hasConflict === true` (FR-004).
   */
  private recomputeConflicts(cells: Cell[]): Cell[] {
    const conflictIndices = new Set(this.solver.findConflicts(toGrid(cells)));
    return cells.map((cell, index) => ({ ...cell, hasConflict: conflictIndices.has(index) }));
  }
}

/** Flattens a `Cell[]` into the plain `Grid` (number[]) the solver expects. */
function toGrid(cells: Cell[]): number[] {
  return cells.map((cell) => cell.value ?? 0);
}

/** Derives the `PuzzleStatus` implied purely by conflicts/empty-cells (used where solver state isn't relevant). */
export function deriveBasicStatus(cells: Cell[], hasConflict: boolean): PuzzleStatus {
  if (hasConflict) return 'invalid';
  return cells.some((cell) => cell.value === null) ? 'unsolved' : 'solved';
}
