import { PuzzleStore } from './puzzle-store';
import { ExamplePuzzleProvider } from '../data/example-puzzle-provider';
import { SudokuSolverService } from '../solver/solver';
import { ExamplePuzzle } from '../models/example-puzzle';
import { Puzzle } from '../models/puzzle';

/**
 * Contract tests for {@link PuzzleStore} (contracts/puzzle-store.md
 * "Behavioral guarantees"). Added by Convergence T042 to give the store's
 * FR-004/FR-009/FR-011 orchestration logic fast, isolated regression
 * coverage (Constitution Principle III, NON-NEGOTIABLE), complementing the
 * existing end-to-end Playwright coverage.
 */
describe('PuzzleStore', () => {
  let store: PuzzleStore;
  let examples: ExamplePuzzleProvider;

  /** Wikipedia's canonical "easy" example puzzle; known unique solution. */
  const uniquelySolvablePuzzle = [
    5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 0, 6,
    0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 2, 8, 0, 0,
    0, 0, 4, 1, 9, 0, 0, 5, 0, 0, 0, 0, 8, 0, 0, 7, 9,
  ];

  const easyExample: ExamplePuzzle = {
    id: 'easy-1',
    label: 'Easy Example',
    difficulty: 'easy',
    givens: uniquelySolvablePuzzle,
  };
  const otherExample: ExamplePuzzle = {
    id: 'easy-2',
    label: 'Other Example',
    difficulty: 'easy',
    givens: new Array(81).fill(0).map((_, i) => (i === 0 ? 4 : 0)),
  };

  beforeEach(() => {
    examples = {
      getAll: () => [easyExample, otherExample],
      getRandom: () => easyExample,
      getById: (id: string) => [easyExample, otherExample].find((e) => e.id === id),
    } as ExamplePuzzleProvider;
    store = new PuzzleStore(examples, new SudokuSolverService());
  });

  function snapshot(): Puzzle {
    let value!: Puzzle;
    store.puzzle$.subscribe((p) => (value = p));
    return value;
  }

  it('loadExample fully replaces prior state, seeding given cells from the example', () => {
    store.startCustomPuzzle();
    store.setCellValue(1, 7);
    store.loadExample('easy-1');

    const puzzle = snapshot();
    expect(puzzle.source).toBe('example');
    expect(puzzle.exampleId).toBe('easy-1');
    expect(puzzle.status).toBe('unsolved');
    puzzle.cells.forEach((cell, index) => {
      const expected = uniquelySolvablePuzzle[index];
      expect(cell.value).toBe(expected === 0 ? null : expected);
      expect(cell.origin).toBe(expected === 0 ? 'empty' : 'given');
    });
  });

  it('re-selecting the currently displayed example resets it to its original given digits', () => {
    store.loadExample('easy-1');
    store.setCellValue(2, 4); // fill an empty, non-given cell
    store.loadExample('easy-1'); // re-select the same example

    const puzzle = snapshot();
    expect(puzzle.cells[2].value).toBeNull();
    expect(puzzle.cells[2].origin).toBe('empty');
  });

  it('startCustomPuzzle fully replaces prior state with a blank grid', () => {
    store.loadExample('easy-1');
    store.startCustomPuzzle();

    const puzzle = snapshot();
    expect(puzzle.source).toBe('custom');
    expect(puzzle.status).toBe('unsolved');
    expect(puzzle.cells.every((cell) => cell.value === null && cell.origin === 'empty')).toBeTrue();
  });

  it('setCellValue rejects edits to a given cell', () => {
    store.loadExample('easy-1');
    store.setCellValue(0, 9); // index 0 is a given digit (5) in easyExample

    const puzzle = snapshot();
    expect(puzzle.cells[0].value).toBe(5);
    expect(puzzle.cells[0].origin).toBe('given');
  });

  it('setCellValue on a non-given cell updates the value and recomputes conflicts', () => {
    store.startCustomPuzzle();
    store.setCellValue(0, 4);
    store.setCellValue(1, 4); // duplicate in the same row

    const puzzle = snapshot();
    expect(puzzle.cells[0].hasConflict).toBeTrue();
    expect(puzzle.cells[1].hasConflict).toBeTrue();
    expect(puzzle.status).toBe('invalid');
  });

  it('solveAll is a no-op while the puzzle is invalid', async () => {
    store.startCustomPuzzle();
    store.setCellValue(0, 4);
    store.setCellValue(1, 4); // introduces a conflict -> status 'invalid'

    await store.solveAll();

    const puzzle = snapshot();
    expect(puzzle.status).toBe('invalid');
    expect(puzzle.cells.some((c) => c.origin === 'solver-filled')).toBeFalse();
  });

  it('solveNextDigit is a no-op while the puzzle is invalid', async () => {
    store.startCustomPuzzle();
    store.setCellValue(0, 4);
    store.setCellValue(1, 4); // introduces a conflict -> status 'invalid'

    await store.solveNextDigit();

    const puzzle = snapshot();
    expect(puzzle.status).toBe('invalid');
    expect(puzzle.cells.some((c) => c.origin === 'solver-filled')).toBeFalse();
  });

  it('solveAll fills every remaining cell and marks the puzzle solved', async () => {
    store.loadExample('easy-1');
    await store.solveAll();

    const puzzle = snapshot();
    expect(puzzle.status).toBe('solved');
    expect(puzzle.cells.every((cell) => cell.value !== null)).toBeTrue();
  });

  it('solveNextDigit is a safe no-op once the puzzle is already solved', async () => {
    store.loadExample('easy-1');
    await store.solveAll();
    const solved = snapshot();

    await store.solveNextDigit();

    const puzzle = snapshot();
    expect(puzzle.status).toBe('solved');
    expect(puzzle.cells).toEqual(solved.cells);
  });

  it('reset restores the original given digits and discards solver-filled digits', async () => {
    store.loadExample('easy-1');
    await store.solveAll();

    store.reset();

    const puzzle = snapshot();
    expect(puzzle.status).toBe('unsolved');
    puzzle.cells.forEach((cell, index) => {
      const expected = uniquelySolvablePuzzle[index];
      expect(cell.value).toBe(expected === 0 ? null : expected);
      expect(cell.origin).toBe(expected === 0 ? 'empty' : 'given');
    });
  });

  // FR-013 / US5: selectCell marks the single cell the user is about to change.
  describe('selectCell', () => {
    it('marks the given cell index as selectedIndex', () => {
      store.loadExample('easy-1');
      store.selectCell(5);

      expect(snapshot().selectedIndex).toBe(5);
    });

    it('selecting a different cell moves the marking (never more than one at once)', () => {
      store.loadExample('easy-1');
      store.selectCell(5);
      store.selectCell(10);

      expect(snapshot().selectedIndex).toBe(10);
    });

    it('selecting a given cell is allowed', () => {
      store.loadExample('easy-1');
      expect(snapshot().cells[0].origin).toBe('given');

      store.selectCell(0);

      expect(snapshot().selectedIndex).toBe(0);
    });

    it('selecting null clears the selection', () => {
      store.loadExample('easy-1');
      store.selectCell(5);
      store.selectCell(null);

      expect(snapshot().selectedIndex).toBeUndefined();
    });

    it('loadExample clears any current selection', () => {
      store.loadExample('easy-1');
      store.selectCell(5);

      store.loadExample('easy-2');

      expect(snapshot().selectedIndex).toBeUndefined();
    });

    it('startCustomPuzzle clears any current selection', () => {
      store.loadExample('easy-1');
      store.selectCell(5);

      store.startCustomPuzzle();

      expect(snapshot().selectedIndex).toBeUndefined();
    });

    it('reset clears any current selection', async () => {
      store.loadExample('easy-1');
      await store.solveAll();
      store.selectCell(5);

      store.reset();

      expect(snapshot().selectedIndex).toBeUndefined();
    });

    it('setCellValue preserves the current selection unchanged', () => {
      store.startCustomPuzzle();
      store.selectCell(5);

      store.setCellValue(1, 4);

      expect(snapshot().selectedIndex).toBe(5);
    });

    it('solveAll preserves the current selection unchanged', async () => {
      store.loadExample('easy-1');
      store.selectCell(5);

      await store.solveAll();

      expect(snapshot().selectedIndex).toBe(5);
    });

    it('solveNextDigit preserves the current selection unchanged', async () => {
      store.loadExample('easy-1');
      store.selectCell(5);

      await store.solveNextDigit();

      expect(snapshot().selectedIndex).toBe(5);
    });
  });
});
