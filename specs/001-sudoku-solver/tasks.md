---

description: "Task list template for feature implementation"
---

# Tasks: Sudoku Solver

**Input**: Design documents from `/specs/001-sudoku-solver/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Solver/validator test tasks are included because Constitution Principle III ("Test-First Solver Correctness") is NON-NEGOTIABLE and explicitly requires tests written before implementation for all puzzle-validation and solving logic. UI-only test tasks beyond that are not separately generated since they were not explicitly requested in spec.md; a final e2e task covers the quickstart.md scenarios.

**Documentation**: Constitution Principle I ("Full Documentation", NON-NEGOTIABLE) requires "Undocumented code MUST NOT be merged." Rather than deferring all documentation to the end, each phase below ends with its own documentation subtask that adds TSDoc/inline comments to that phase's code, placed immediately before the phase's checkpoint.

**Organization**: Tasks are grouped by user story (from spec.md: US1 = Instantly Solve the Default Puzzle, US2 = Choose a Specific Example Puzzle, US3 = Enter a Custom Puzzle From Scratch, US4 = Reveal the Solution One Digit at a Time, US5 = See Which Cell Is About to Be Changed) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single Angular CLI workspace at the repository root (per plan.md Structure Decision — no separate backend project):

```text
src/app/core/{models,solver,validator,data,state}/
src/app/features/{board,example-picker,solve-controls}/
src/assets/puzzles/
e2e/
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize the Angular 18 (TypeScript 5.x) CLI workspace with routing and Angular Material + Angular CDK per plan.md Technical Context (`ng new`, `ng add @angular/material`), producing the `src/app/`, `src/assets/`, `src/styles/` layout described in plan.md Project Structure
- [X] T002 [P] Configure linting and formatting (ESLint + Prettier, or Angular CLI defaults) at the workspace root so all subsequent code can be checked for the documentation standard required by Constitution Principle I
- [X] T003 [P] Configure the Jasmine/Karma unit test runner (Angular CLI default, `ng test`) and scaffold a Playwright (or equivalent) end-to-end test project in `e2e/` per plan.md Testing section, wiring an `npm run e2e` script

**Checkpoint**: Workspace builds (`ng build`) and empty test runners (`ng test`, `npm run e2e`) execute successfully.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain model, validator, solver, and bundled puzzle data that every user story depends on. Solver/validator tests are written first per Constitution Principle III (NON-NEGOTIABLE).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Define the `Cell`, `Puzzle`, and `ExamplePuzzle` TypeScript interfaces in `src/app/core/models/cell.ts`, `src/app/core/models/puzzle.ts`, and `src/app/core/models/example-puzzle.ts` per data-model.md, including: `Cell.value` "MUST be an integer 1-9" when present, `Cell.origin` restricted to `'given' | 'user-entered' | 'solver-filled' | 'empty'`, cells with `origin === 'given'` documented as immutable, `Puzzle.status` restricted to `'invalid' | 'unsolved' | 'solving' | 'solved' | 'unsolvable'`, and `ExamplePuzzle.difficulty` restricted to `'easy' | 'medium' | 'hard'`
- [X] T005 [P] Author the bundled example puzzle dataset as static JSON in `src/assets/puzzles/examples.json`, satisfying data-model.md's rule that the set "MUST contain at least 5 `ExamplePuzzle` entries spanning more than one `difficulty` value" (FR-012, SC-006) and that "each `ExamplePuzzle.givens` MUST have exactly one valid classic sudoku solution"
- [X] T006 [P] Write failing unit tests for the conflict validator in `src/app/core/validator/validator.spec.ts`, covering: no conflicts on a valid grid, a duplicate digit in the same row/column/box each independently detected, and `findConflicts` returning the exact 0-80 indices in conflict, per contracts/solver-service.md's `findConflicts` behavioral guarantees and FR-004
- [X] T007 [P] Write failing contract tests for `SudokuSolverService` in `src/app/core/solver/solver.spec.ts` per contracts/solver-service.md's "Contract test expectations": a valid uniquely-solvable puzzle resolves the correct solution; an unsolvable puzzle resolves `solvable: false` without hanging; a puzzle with multiple valid solutions resolves some valid solution (verified via `findConflicts` on the result); an already-solved grid makes `solveNextDigit` resolve `hadEmptyCell: false` with no `cellIndex`/`digit`; a conflicting grid is rejected/guarded against
- [X] T008 Implement the conflict validator (`findConflicts`, synchronous and pure) in `src/app/core/validator/validator.ts` to make the T006 tests pass (depends on T004, T006)
- [X] T009 Implement `SudokuSolverService` (`solveAll`, `solveNextDigit`) using constraint-propagation-assisted backtracking, executed via a Web Worker or chunked async computation so the caller's UI thread is never blocked (Constitution Principle IV), in `src/app/core/solver/solver.ts` and `src/app/core/solver/solver.worker.ts`, to make the T007 tests pass (depends on T004, T007)
- [X] T010 Implement `ExamplePuzzleProvider` (`getAll`, `getRandom`, `getById`, synchronous, no live network call) in `src/app/core/data/example-puzzle-provider.ts`, reading the bundled `src/assets/puzzles/examples.json` from T005 (depends on T004, T005)
- [X] T011 Implement the `PuzzleStore` service (`puzzle$`, `loadRandomExample`, `loadExample`, `startCustomPuzzle`, `setCellValue`, `solveAll`, `solveNextDigit`, `reset`) per contracts/puzzle-store.md in `src/app/core/state/puzzle-store.ts`, enforcing that `setCellValue` "MUST reject/ignore attempts to modify a cell whose `origin === 'given'`" and that puzzle-replacing actions "MUST fully replace the puzzle (no leftover digits from the previous puzzle)" (depends on T008, T009, T010)
- [X] T012 Configure the Angular application bootstrap and Material theming (`provideAnimations`, Material theme, base layout) in `src/app/app.config.ts` and `src/styles/`
- [X] T013 [P] Add TSDoc comments to every public interface, class, and function created in T004-T012 (models, validator, solver, `solver.worker.ts`, `ExamplePuzzleProvider`, `PuzzleStore`, app bootstrap), describing purpose/parameters/return values, plus inline comments explaining the constraint-propagation/backtracking steps in `src/app/core/solver/solver.ts`, per Constitution Principle I (NON-NEGOTIABLE — "Undocumented code MUST NOT be merged")

**Checkpoint**: Foundation ready and fully documented — solver/validator tests pass, `PuzzleStore` and `ExamplePuzzleProvider` are available for all user stories.

---

## Phase 3: User Story 1 - Instantly Solve the Default Puzzle (Priority: P1) 🎯 MVP

**Goal**: On first load, show a random bundled example puzzle with no setup/login, and let the user fill it in completely via "Solve All".

**Independent Test**: Load the application with no prior interaction; a puzzle is already displayed; click "Solve All" and confirm every cell fills with a valid, fully solved classic sudoku grid, with no login step at any point (spec.md User Story 1, Acceptance Scenarios 1-3).

### Implementation for User Story 1

- [X] T014 [US1] Implement `PuzzleBoardComponent` to render the 9x9 grid from `PuzzleStore.puzzle$`, visually distinguishing `given` cells from `solver-filled` cells (FR-010) in `src/app/features/board/board.component.ts` (+ `.html`/`.scss`)
- [X] T015 [US1] Implement `SolveControlsComponent` with a "Solve All" button that calls `PuzzleStore.solveAll()` in `src/app/features/solve-controls/solve-controls.component.ts` (+ `.html`/`.scss`)
- [X] T016 [US1] Wire `AppComponent` to call `PuzzleStore.loadRandomExample()` once on startup so a puzzle is displayed within ~1s of load with no user action (FR-001, SC-001) in `src/app/app.component.ts`
- [X] T017 [US1] Add a "solving" loading indicator on `SolveControlsComponent` while the `solveAll()` promise is pending, and disable the button during that time, in `src/app/features/solve-controls/solve-controls.component.ts`
- [X] T018 [US1] Add a clear "no solution exists" message shown by `PuzzleBoardComponent`/`SolveControlsComponent` when `solveAll()` resolves `solvable: false`, without freezing or crashing (FR-007, SC-007) in `src/app/features/board/board.component.ts`
- [X] T019 [US1] Add baseline keyboard navigation (arrow keys between cells) and ARIA grid semantics (`role="grid"`/`"row"`/`"gridcell"`, accessible names for given vs. solved cells) to `PuzzleBoardComponent`, satisfying Constitution Principle V for the MVP per plan.md's "MVP scope note" and research.md's Accessibility decision, in `src/app/features/board/board.component.ts` (+ `.html`)
- [X] T020 [US1] Add TSDoc comments to every public class/method/input/output added in T014-T019 (`PuzzleBoardComponent` including its keyboard/ARIA handling, `SolveControlsComponent`, `AppComponent` wiring), per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: User Story 1 is fully functional, documented, keyboard/ARIA-accessible, and independently testable — reload the app, see a puzzle, navigate it via keyboard, click Solve All, see it solved.

---

## Phase 4: User Story 2 - Choose a Specific Example Puzzle (Priority: P2)

**Goal**: Let users browse the bundled example puzzles and load a specific one onto the board.

**Independent Test**: From the example list, select a puzzle other than the one currently displayed and confirm the board updates to show exactly that puzzle's given digits, with any prior progress cleared (spec.md User Story 2, Acceptance Scenarios 1-3).

### Implementation for User Story 2

- [X] T021 [P] [US2] Implement `ExamplePickerComponent` listing every puzzle from `ExamplePuzzleProvider.getAll()` with its difficulty label (FR-002, FR-012) in `src/app/features/example-picker/example-picker.component.ts` (+ `.html`/`.scss`)
- [X] T022 [US2] Wire `ExamplePickerComponent` selection to `PuzzleStore.loadExample(id)`, replacing the board with the selected puzzle's given digits and clearing prior progress (FR-002) in `src/app/features/example-picker/example-picker.component.ts`
- [X] T023 [US2] Ensure re-selecting the currently displayed example puzzle resets it to its original given digits (Edge Cases) by updating `PuzzleStore.loadExample` in `src/app/core/state/puzzle-store.ts`
- [X] T024 [US2] Add TSDoc comments to every public class/method added or changed in T021-T023 (`ExamplePickerComponent`, the `loadExample` reset behavior in `PuzzleStore`), per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: User Stories 1 and 2 both work independently, and are fully documented — users can browse and switch between bundled example puzzles and solve any of them.

---

## Phase 5: User Story 4 - Reveal the Solution One Digit at a Time (Priority: P2)

**Goal**: Let users reveal the solution incrementally via "Solve Next Digit" instead of all at once.

**Independent Test**: With any valid puzzle loaded, click "Solve Next Digit" once and confirm exactly one additional correct digit appears; repeat until solved and confirm the result matches "Solve All"; click once more on a solved puzzle and confirm no destructive action occurs (spec.md User Story 4, Acceptance Scenarios 1-3).

### Implementation for User Story 4

- [X] T025 [US4] Add a "Solve Next Digit" button to `SolveControlsComponent` that calls `PuzzleStore.solveNextDigit()` (FR-006) in `src/app/features/solve-controls/solve-controls.component.ts`
- [X] T026 [US4] Ensure `PuzzleStore.solveNextDigit()` is a safe no-op (no error, no board change) when the puzzle is already `solved` (User Story 4 Acceptance Scenario 3) and that repeated calls converge to the same final grid `solveAll()` would produce, in `src/app/core/state/puzzle-store.ts`
- [X] T027 [US4] Add a brief visual highlight on the most recently solver-filled cell in `PuzzleBoardComponent` so each "Solve Next Digit" click is clearly perceivable (SC-003) in `src/app/features/board/board.component.ts`
- [X] T028 [US4] Add TSDoc comments to every public class/method added or changed in T025-T027 (`SolveControlsComponent`'s new button handler, the `solveNextDigit` no-op/convergence logic in `PuzzleStore`, `PuzzleBoardComponent`'s highlight logic), per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: User Stories 1, 2, and 4 all work independently, and are fully documented — users can step through a solution one digit at a time on any loaded puzzle.

---

## Phase 6: User Story 3 - Enter a Custom Puzzle From Scratch (Priority: P3)

**Goal**: Let users start from a blank grid, type in their own puzzle's given digits, get real-time conflict feedback, and solve it (or be told it's unsolvable).

**Independent Test**: Start a blank grid, type in a known valid set of given digits for a classic puzzle, confirm no conflicts are flagged, and click "Solve All" to confirm it solves correctly; separately, enter a conflicting digit and confirm it is flagged immediately, and enter an unsolvable configuration and confirm a clear message appears (spec.md User Story 3, Acceptance Scenarios 1-4).

### Implementation for User Story 3

- [X] T029 [US3] Add a "start custom puzzle" entry point that calls `PuzzleStore.startCustomPuzzle()`, presenting a blank 9x9 grid (FR-003) in `src/app/app.component.ts` and `src/app/features/board/board.component.ts`
- [X] T030 [US3] Implement editable cell input in `PuzzleBoardComponent`, restricted to cells where `origin !== 'given'`, calling `PuzzleStore.setCellValue(cellIndex, value)` on entry/clear in `src/app/features/board/board.component.ts`
- [X] T031 [US3] Implement real-time conflict highlighting per cell using `Puzzle.cells[].hasConflict`, updated on every keystroke (FR-004, SC-004) in `src/app/features/board/board.component.ts`
- [X] T032 [US3] Disable/block the "Solve All" and "Solve Next Digit" actions in `SolveControlsComponent` while `puzzle.status === 'invalid'` (FR-011) in `src/app/features/solve-controls/solve-controls.component.ts`
- [X] T033 [US3] Add a "Reset" action to `SolveControlsComponent` wired to `PuzzleStore.reset()`, restoring the puzzle's original given digits (FR-009) in `src/app/features/solve-controls/solve-controls.component.ts`
- [X] T034 [US3] Add TSDoc comments to every public class/method added or changed in T029-T033 (custom-entry entry point, editable-cell handling, conflict-highlighting logic, solve-blocking logic, and the reset action), per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: All four user stories are independently functional and fully documented — the full feature set from spec.md is implemented.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and the constitution's non-functional principles

- [X] T035 [P] Add accessibility refinements beyond the US1 baseline (T019): ARIA live-region announcements when a solve action fills cells or a conflict appears/clears, and focus-order polish across `PuzzleBoardComponent`, satisfying Constitution Principle V, in `src/app/features/board/board.component.ts` (+ `.html`)
- [X] T036 [P] Add responsive layout styling for desktop and mobile viewports across the board, example picker, and solve controls, satisfying Constitution Principle V, in `src/styles/` and each feature component's `.scss` file
- [X] T037 [P] Perform a final documentation consistency pass across `src/app/core/` and `src/app/features/`, spot-checking that every public class/method has TSDoc left by T013/T020/T024/T028/T034 and filling any gaps found (including the new T035/T036 code), per Constitution Principle I (NON-NEGOTIABLE)
- [X] T038 Write end-to-end tests covering quickstart.md Scenarios 1-5 (default puzzle solve, example selection, custom entry with conflict/unsolvable handling, step-by-step solving, reset) in `e2e/sudoku-solver.spec.ts`, including an assertion that no login/authentication UI or route is ever presented across any scenario (FR-008, SC-005)
- [X] T039 Run the full quickstart.md validation pass (`ng test`, `npm run e2e`, manual review) and confirm every item in quickstart.md's Success Criteria checklist (SC-001 through SC-007) passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (solver/validator/store must exist, pass their tests, and be documented (T013) first, per Constitution Principles I and III)
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - Can proceed in priority order (US1 → US2 → US4 → US3, matching P1 → P2 → P2 → P3), or in parallel if staffed, since each story only adds its own components on top of the shared `PuzzleStore`
- **Polish (Phase 7)**: Depends on all four user stories being complete
- **Convergence (Phase 8)**: Depended on Phase 1-7 already being implemented; already complete (T040-T042 done)
- **User Story 5 (Phase 9)**: Depends on Foundational (Phase 2, for `Puzzle`/`PuzzleStore`) and on `PuzzleBoardComponent` existing (T014 from US1) to wire its click/keyboard handlers into; otherwise independent of US2/US3/US4/Convergence

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Reuses `PuzzleStore`/`ExamplePuzzleProvider` from Foundational; independently testable without US1's UI being complete
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Only depends on `SolveControlsComponent` existing (T015 from US1) to add its button; otherwise independent
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Reuses `PuzzleBoardComponent`/`SolveControlsComponent` scaffolding from US1; independently testable via its own acceptance scenarios
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) and after `PuzzleBoardComponent` exists (T014 from US1) - Adds `Puzzle.selectedIndex`, `PuzzleStore.selectCell`, and board wiring; independently testable via its own acceptance scenarios without US2/US3/US4 being complete

### Within Each User Story

- Foundational tests (T006, T007) MUST be written and FAIL before their corresponding implementation (T008, T009)
- Models/data before services (T004/T005 before T009/T010)
- Services before store (T008-T010 before T011)
- Store before UI components (T011 before any Phase 3-6 task)
- Each phase's documentation subtask (T013, T020, T024, T028, T034, T047) runs last within that phase, immediately before its checkpoint, and only after that phase's other tasks are complete
- Story complete before moving to the next priority (if working sequentially)
- Within US5: model field (T043) before store method (T044); store tests (T045) can run parallel to/after T044 but should be written first per Constitution Principle III's test-first spirit; board wiring (T046) depends on the store method (T044); docs (T047) last

### Parallel Opportunities

- T002 and T003 (Setup) can run in parallel
- T004, T005, T006, T007 (Foundational) can all run in parallel (different files, no interdependencies)
- Once Foundational (Phase 2) completes, Phases 3-6 (US1, US2, US4, US3) can be worked on in parallel by different developers, since each adds its own feature components on top of the shared, already-tested `PuzzleStore`
- T021 (US2) can run in parallel with other US2 tasks' setup, though T022/T023 depend on it
- T035, T036 (Polish) can run in parallel; T037 depends on all prior documentation subtasks (T013, T020, T024, T028, T034) and on T035/T036
- Phase 9 (US5) can run in parallel with Phases 4-6 (US2, US4, US3) once Foundational and US1's `PuzzleBoardComponent` (T014) exist; T045 (store tests) is marked [P] since it is a separate file from T044/T046

---


## Parallel Example: Foundational Phase

```bash
# Launch all independent Foundational tasks together:
Task: "Define Cell, Puzzle, ExamplePuzzle interfaces in src/app/core/models/*.ts"
Task: "Author bundled example puzzle dataset in src/assets/puzzles/examples.json"
Task: "Write failing validator unit tests in src/app/core/validator/validator.spec.ts"
Task: "Write failing SudokuSolverService contract tests in src/app/core/solver/solver.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories; includes test-first solver/validator work per Constitution Principle III and its documentation subtask T013 per Constitution Principle I)
3. Complete Phase 3: User Story 1 (including baseline keyboard/ARIA accessibility T019 and its documentation subtask T020)
4. **STOP and VALIDATE**: Load the app, confirm a random puzzle appears, click "Solve All", confirm it solves correctly, with no login step, and confirm the board is operable via keyboard alone
5. Deploy/demo if ready — this is the MVP described in spec.md, and it is constitution-compliant (Principle V) from the first release

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (solver/validator tested and documented, `PuzzleStore` available)
2. Add User Story 1 (+ baseline keyboard/ARIA T019, + T020 docs) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (+ T024 docs) → Test independently → Deploy/Demo (example selection)
4. Add User Story 4 (+ T028 docs) → Test independently → Deploy/Demo (step-by-step solving)
5. Add User Story 3 (+ T034 docs) → Test independently → Deploy/Demo (custom puzzle entry)
6. Add Phase 7 Polish → Accessibility refinements beyond the US1 baseline, documentation consistency pass, and e2e coverage
7. Add User Story 5 (+ T047 docs) → Test independently → Deploy/Demo (cell selection indicator)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (then User Story 4, which builds on its `SolveControlsComponent`, then User Story 5, which builds on `PuzzleBoardComponent`)
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete, are documented, and integrate independently through the shared `PuzzleStore`

## Phase 8: Convergence

- [X] T040 CRITICAL: Remove the live `fonts.googleapis.com`/`fonts.gstatic.com` links from `src/index.html` and self-host the Roboto and Material Icons assets (or replace `mat-icon` ligature usage with an offline-safe alternative) so the app has no external network dependency after the initial page load per plan: Technical Context offline constraint / Constitution II (contradicts)
- [X] T041 Add a single-given-digit ("single-cell") puzzle test case to `src/app/core/solver/solver.spec.ts` and `src/app/core/validator/validator.spec.ts` per Constitution III (partial)
- [X] T042 Add `src/app/core/state/puzzle-store.spec.ts` unit tests covering the MUST behaviors in `contracts/puzzle-store.md` (given-cell edit rejection + conflict recompute, solve actions blocked while invalid, solveNextDigit no-op when solved, reset restores original givens, loadExample/startCustomPuzzle fully replace prior state) per Constitution III (missing)

---

## Phase 9: User Story 5 - See Which Cell Is About to Be Changed (Priority: P2)

**Goal**: Visually mark the single cell the user has selected (by click or keyboard focus), so they can see exactly which cell will receive their next typed digit, per spec.md's added User Story 5 and FR-013.

**Independent Test**: Click any cell on the board and confirm it is visually marked as selected; click a different cell and confirm the marking moves to the newly clicked cell and no longer appears on the previous one; confirm the marking also follows arrow-key keyboard navigation; confirm the marking survives a solver fill on the selected cell; confirm it is cleared when a new example, custom puzzle, or reset is loaded (spec.md User Story 5, Acceptance Scenarios 1-5; Edge Cases).

### Implementation for User Story 5

- [X] T043 [US5] Add `selectedIndex?: number` to the `Puzzle` interface in `src/app/core/models/puzzle.ts` per data-model.md ("Index of the single cell currently marked as selected (FR-013 / US5), or `undefined` if none is selected... mirrors the existing `lastFilledIndex` field's lifecycle")
- [X] T044 [US5] Implement `PuzzleStore.selectCell(index: number | null)` per contracts/puzzle-store.md (accepts any cell index 0-80, including `origin === 'given'` cells) in `src/app/core/state/puzzle-store.ts`, and update `loadRandomExample`, `loadExample`, `startCustomPuzzle`, and `reset` to clear `selectedIndex` (newly published `Puzzle.selectedIndex` is `undefined`) while `setCellValue`, `solveAll`, and `solveNextDigit` preserve the current `selectedIndex` unchanged (depends on T043)
- [X] T045 [P] [US5] Add unit tests for `PuzzleStore.selectCell` in `src/app/core/state/puzzle-store.spec.ts`, covering: selecting a cell marks it as `selectedIndex`; selecting a different cell moves the marking (never more than one at once); selecting a `given` cell is allowed; `loadExample`/`startCustomPuzzle`/`reset` clear the selection; `setCellValue`/`solveAll`/`solveNextDigit` preserve the current selection unchanged (depends on T043; write to fail before T044, per Constitution Principle III's test-first spirit for store logic)
- [X] T046 [US5] Wire cell click and keyboard-focus handlers in `PuzzleBoardComponent` to call `PuzzleStore.selectCell(index)`, and render the cell at `Puzzle.selectedIndex` with a visible marking (CSS class + `aria-selected="true"`) clearly distinguishable from the given/user-entered/solver-filled markings (FR-010) and from the "last filled" highlight (T027), in `src/app/features/board/board.component.ts` (+ `.html`/`.scss`) (depends on T044)
- [X] T047 [US5] Add TSDoc comments to every public member added or changed in T043-T046 (`Puzzle.selectedIndex`, `PuzzleStore.selectCell` and the clearing/preserving changes to the other store methods, `PuzzleBoardComponent`'s selection wiring), per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: User Story 5 is fully functional, documented, and independently testable — clicking or keyboard-navigating to any cell visibly marks it as selected, the marking always matches the cell that would receive a typed digit, and it behaves correctly across solver fills and puzzle changes.

---

## Phase 10: Convergence

- [X] T048 Add an e2e test covering quickstart.md Scenario 6 (cell selection) in `e2e/sudoku-solver.spec.ts` — click a cell and confirm it is marked `aria-selected="true"`/`.selected`; click a different cell and confirm the marking moves and the previous cell is no longer marked; use arrow-key navigation and confirm the marking follows keyboard focus; click "Solve Next Digit" with a cell selected and confirm the selection survives if that cell is solver-filled; select a different example, start a custom puzzle, or reset, and confirm no cell is marked selected afterward — then update quickstart.md's SC-008 checklist row to checked once the test passes, per SC-008 / US5 (missing)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable, documented, and testable
- Verify Foundational tests (T006, T007) fail before implementing T008/T009
- Each phase's documentation subtask (T013/T020/T024/T028/T034) MUST comment/TSDoc that phase's code before the phase's checkpoint is considered met, per Constitution Principle I (NON-NEGOTIABLE — "Undocumented code MUST NOT be merged")
- Baseline keyboard/ARIA accessibility (T019) is delivered inside User Story 1, not Polish, per Constitution Principle V and plan.md's "MVP scope note" — Polish (T035) only adds refinements on top of that baseline
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
