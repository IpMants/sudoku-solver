import { Injectable } from '@angular/core';
import { ExamplePuzzle } from '../models/example-puzzle';
import examplesData from '../../../assets/puzzles/examples.json';

/**
 * Provides read access to the bundled example puzzle set
 * (contracts/puzzle-store.md: `ExamplePuzzleProvider`).
 *
 * Synchronous and backed entirely by the static `src/assets/puzzles/
 * examples.json` asset bundled with the app at build time — there is no live
 * network call (Clarifications; Constitution Principle II).
 */
@Injectable({ providedIn: 'root' })
export class ExamplePuzzleProvider {
  private readonly puzzles: ExamplePuzzle[] = examplesData.puzzles as ExamplePuzzle[];

  /** Returns the full bundled set of example puzzles (FR-002, FR-012). */
  getAll(): ExamplePuzzle[] {
    return this.puzzles;
  }

  /** Returns one uniformly-random example puzzle (FR-001). */
  getRandom(): ExamplePuzzle {
    const index = Math.floor(Math.random() * this.puzzles.length);
    return this.puzzles[index];
  }

  /** Returns a specific example puzzle by id, or `undefined` if not found. */
  getById(id: string): ExamplePuzzle | undefined {
    return this.puzzles.find((puzzle) => puzzle.id === id);
  }
}
