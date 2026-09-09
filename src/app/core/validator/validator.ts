/**
 * A 9x9 grid of digits, 0 = empty, 1-9 = filled, in row-major order (81
 * entries) — see contracts/solver-service.md.
 */
export type Grid = number[];

const GRID_SIZE = 9;
const BOX_SIZE = 3;

/**
 * Validates a grid for classic sudoku rule conflicts (duplicate digit in a
 * row, column, or 3x3 box). Synchronous and pure (no side effects), so it can
 * run on every keystroke for real-time validation (FR-004) without
 * performance concerns.
 *
 * @param grid a 9x9 grid, 0 = empty, 1-9 = filled, row-major, 81 entries.
 * @returns the 0-80 indices of every cell currently in conflict with another.
 */
export function findConflicts(grid: Grid): number[] {
  const conflicts = new Set<number>();

  const rows = new Map<number, number[]>();
  const cols = new Map<number, number[]>();
  const boxes = new Map<number, number[]>();

  for (let index = 0; index < grid.length; index++) {
    const value = grid[index];
    if (value === 0) continue;

    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const box = Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(col / BOX_SIZE);

    addAndFlagDuplicates(rows, row, value, index, conflicts);
    addAndFlagDuplicates(cols, col, value, index, conflicts);
    addAndFlagDuplicates(boxes, box, value, index, conflicts);
  }

  return Array.from(conflicts);
}

/**
 * Tracks `(groupKey -> [index, ...])` per-digit occurrences within a group
 * (row, column, or box) and marks every cell sharing that group+digit as
 * conflicting once a second occurrence is seen.
 */
function addAndFlagDuplicates(
  groups: Map<number, number[]>,
  groupKey: number,
  value: number,
  index: number,
  conflicts: Set<number>,
): void {
  // Compose a single map key from the group id and the digit, so each
  // (group, digit) pair tracks its own occurrence list.
  const key = groupKey * 10 + value;
  const existing = groups.get(key);
  if (existing) {
    existing.push(index);
    if (existing.length >= 2) {
      for (const i of existing) conflicts.add(i);
    }
  } else {
    groups.set(key, [index]);
  }
}
