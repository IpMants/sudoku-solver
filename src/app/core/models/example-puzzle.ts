/**
 * Descriptive difficulty label for a bundled example puzzle (data-model.md:
 * ExamplePuzzle). Descriptive only — does not change solving behavior
 * (Assumptions).
 */
export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

/**
 * One curated, bundled classic sudoku puzzle available for selection
 * (FR-002, FR-012; data-model.md: ExamplePuzzle).
 */
export interface ExamplePuzzle {
  /** Stable identifier within the bundled set. */
  id: string;
  /** Human-readable name/description shown in the picker. */
  label: string;
  /** Descriptive difficulty; does not affect solving behavior. */
  difficulty: PuzzleDifficulty;
  /**
   * The puzzle's starting digits, row-major order, exactly 81 entries.
   * 0 = empty, 1-9 = given digit. MUST have exactly one valid classic sudoku
   * solution (verified when the bundled set is authored, not at runtime).
   */
  givens: readonly number[];
}
