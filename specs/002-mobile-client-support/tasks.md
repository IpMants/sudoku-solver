---

description: "Task list template for feature implementation"
---

# Tasks: Mobile Client Support

**Input**: Design documents from `/specs/002-mobile-client-support/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested as TDD in spec.md, and no new solver/validator logic is touched (Constitution Principle III's NON-NEGOTIABLE test-first rule applies to solving/validation logic only, which this feature does not change). Component/unit tests for the new `DigitKeypadComponent`/`ViewportService` and end-to-end mobile scenarios are still included in the Polish phase, matching `001-sudoku-solver`'s pattern of covering UI work with a final verification pass rather than a per-story TDD gate.

**Documentation**: Constitution Principle I ("Full Documentation", NON-NEGOTIABLE) requires "Undocumented code MUST NOT be merged." Each phase below ends with its own documentation subtask, placed immediately before the phase's checkpoint, matching `001-sudoku-solver`'s convention.

**Organization**: Tasks are grouped by user story (from spec.md: US1 = Solve a Puzzle on a Mobile Browser, US2 = Enter Custom Digits by Touch, US3 = Use All Existing Features on Mobile) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Extends the existing single Angular CLI workspace from `001-sudoku-solver` (per plan.md Structure Decision — no new project, no backend):

```text
src/app/core/state/           # existing PuzzleStore + new ViewportService
src/app/features/{board,example-picker,solve-controls,digit-keypad}/
src/app/app.component.{ts,html,scss}
src/styles/
e2e/
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared breakpoint definition and mobile e2e tooling needed before any story-specific work

- [X] T001 Add a shared "compact viewport" breakpoint definition (max-width consistent with the tablet/phone range from research.md's CSS-breakpoint decision, e.g. 768px) as a SCSS variable in a new `src/styles/_breakpoints.scss` partial, imported by `src/app/app.component.scss` and `src/app/features/board/board.component.scss`
- [X] T002 [P] Add Playwright mobile projects to `playwright.config.ts`: a device-emulation project (e.g., `devices['iPhone 13']`) and a raw 360px-wide custom-viewport project, per research.md's Playwright decision, so later mobile e2e specs can target them

**Checkpoint**: Shared breakpoint value exists in SCSS and Playwright is configured to run mobile-viewport projects.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: A single TypeScript source of truth for "is the viewport compact" that both the layout wiring (US1) and the on-screen keypad (US2) depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Implement `ViewportService` in `src/app/core/state/viewport.service.ts`, wrapping Angular CDK's `BreakpointObserver` (`@angular/cdk/layout`) bound to the same breakpoint value defined in T001, exposing `readonly isCompactViewport$: Observable<boolean>` (research.md: CSS-breakpoint decision, not user-agent sniffing) (depends on T001)
- [X] T004 [P] Add TSDoc comments to `ViewportService` and its public `isCompactViewport$` member describing purpose and the breakpoint it observes, per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: Foundation ready — `ViewportService.isCompactViewport$` is available for both the layout (US1) and the keypad (US2).

---

## Phase 3: User Story 1 - Solve a Puzzle on a Mobile Browser (Priority: P1) 🎯 MVP

**Goal**: The existing puzzle grid, example picker, and solve controls fit and remain usable on mobile-browser viewports (down to 360px wide), in both portrait and landscape, with "Solve All" working exactly as on desktop.

**Independent Test**: Load the application in a mobile browser (or a 360px-wide viewport), confirm the grid and controls fit with no horizontal scrolling or zooming, tap "Solve All", confirm the puzzle solves correctly, and confirm the layout remains usable after rotating to landscape (spec.md User Story 1, Acceptance Scenarios 1-3).

### Implementation for User Story 1

- [X] T005 [US1] Add responsive rules to `src/app/app.component.scss` (currently empty) using the T001 breakpoint so `.app-layout`'s sidebar (`app-example-picker` + "Start Custom Puzzle" button) stacks above `.app-main` (board + solve controls) at compact widths, with both taking the full available width and no horizontal overflow (FR-001, SC-001)
- [X] T006 [US1] Extend `src/app/features/board/board.component.scss`'s existing `clamp()`-based cell sizing so the full 9x9 grid, including its 2px outer border and 3px box-separator borders, fits within a 360px-wide viewport with no horizontal scrollbar and no manual zoom required (FR-001, SC-001, SC-005)
- [X] T007 [P] [US1] Review and adjust `src/app/features/solve-controls/solve-controls.component.scss` and `src/app/features/example-picker/example-picker.component.scss` so their buttons/lists reflow (e.g., wrap or stack) rather than clip or force horizontal scrolling at compact widths (FR-001)
- [X] T008 [US1] Verify layout stability across a portrait/landscape rotation at compact widths (no fixed-viewport-height rules that break on rotation) in `src/app/app.component.scss`/`src/app/features/board/board.component.scss`, adjusting any orientation-fragile CSS found (FR-008)
- [X] T009 [US1] Add SCSS comments documenting the new breakpoint rules added in T005-T008 and update any affected component TSDoc that references layout behavior, per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: User Story 1 is fully functional and independently testable — the app is usable end-to-end (including "Solve All") on a 360px-wide mobile viewport in both orientations.

---

## Phase 4: User Story 2 - Enter Custom Digits by Touch (Priority: P1)

**Goal**: A touch-friendly on-screen keypad (digits 1-9 + Clear) appears whenever a non-given cell is selected on a compact viewport, lets the user enter/clear digits without the device's native keyboard, and follows cell selection changes.

**Independent Test**: On a mobile browser (or compact viewport with touch emulation), tap an empty cell, confirm the on-screen keypad appears, tap a digit and confirm it's entered, enter a conflicting digit and confirm the conflict is highlighted immediately, tap Clear and confirm the digit is removed, then select a different cell and confirm the keypad follows (spec.md User Story 2, Acceptance Scenarios 1-5).

### Implementation for User Story 2

- [X] T010 [P] [US2] Scaffold `DigitKeypadComponent` (standalone Angular component) in `src/app/features/digit-keypad/digit-keypad.component.ts` (+ `.html`/`.scss`), injecting `PuzzleStore` and `ViewportService` and exposing `puzzle$`/`isCompactViewport$` per contracts/digit-keypad.md
- [X] T011 [US2] Render 10 buttons (digits 1-9 and "Clear") in `digit-keypad.component.html`, each with `aria-label="Enter {digit}"` / `aria-label="Clear cell"`, wrapped in a `role="group"` container labeled `aria-label="Digit entry keypad"`, per contracts/digit-keypad.md and FR-003b (depends on T010)
- [X] T012 [US2] Style each keypad button in `digit-keypad.component.scss` with a minimum tappable target of 44x44 CSS pixels (Clarifications; FR-003) (depends on T010)
- [X] T013 [US2] Implement `onDigitTap(digit: number)` and `onClearTap()` in `digit-keypad.component.ts`, calling `PuzzleStore.setCellValue(targetCellIndex, digit)` / `PuzzleStore.setCellValue(targetCellIndex, null)` for the currently selected non-given cell, and a no-op when no eligible cell is selected (FR-004; contracts/digit-keypad.md) (depends on T010)
- [X] T014 [US2] Derive `targetCellIndex` and overall visibility in `digit-keypad.component.ts`: render (and be focusable/in the tab order) only when `isCompactViewport$` emits `true` AND `puzzle.selectedIndex` references a cell whose `origin !== 'given'`; otherwise set `aria-hidden` and remove from the tab order (FR-002, FR-003; Key Entities: On-Screen Keypad) (depends on T010)
- [X] T015 [US2] Position the keypad in `digit-keypad.component.scss` in normal document flow directly below the board (never overlapping the selected cell or any other control, since sibling elements reflow around it instead of it floating over them) — a revision of the original fixed-panel plan after e2e testing showed a fixed panel intercepts taps on the controls it overlaps (Edge Cases; research.md positioning decision, revised) (depends on T010)
- [X] T016 [US2] Confirm the keypad never focuses/summons the device's native virtual keyboard (no hidden text `<input>`, no `inputmode` attribute on any keypad element) in `digit-keypad.component.html`/`.ts` (Edge Cases) (depends on T010-T014)
- [X] T017 [US2] Mount `<app-digit-keypad>` in `src/app/app.component.html`, confirming it renders nothing (and takes no layout space) when `isCompactViewport$` is `false`, so the existing desktop layout is unaffected
- [X] T018 [US2] Manually verify real-time conflict highlighting (`Cell.hasConflict`, already implemented in `BoardComponent`) is correctly triggered for digits entered via the new keypad (FR-006) since both paths call the same `PuzzleStore.setCellValue`; record confirmation or file a follow-up if a gap is found
- [X] T019 [US2] Manually verify physical/paired-keyboard digit entry via `BoardComponent.onGridKeydown` continues to work unchanged alongside the new keypad at compact viewport widths (FR-003a); record confirmation or file a follow-up if a gap is found
- [X] T020 [US2] Add TSDoc comments to every public class/method in `DigitKeypadComponent` (T010-T017), per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: User Stories 1 and 2 both work independently — the app is usable and puzzles are fully enterable by touch on a compact viewport.

---

## Phase 5: User Story 3 - Use All Existing Features on Mobile (Priority: P2)

**Goal**: Example selection, "Solve Next Digit", and "Reset" all remain fully available and behave identically on mobile/compact viewports as on desktop.

**Independent Test**: On a compact viewport, open the example list and select a puzzle, tap "Solve Next Digit" once, and tap "Reset"; confirm each action produces the same result as on desktop (spec.md User Story 3, Acceptance Scenarios 1-3).

### Implementation for User Story 3

- [X] T021 [P] [US3] Verify (and adjust touch target sizing if needed to reach 44x44 CSS pixels) that opening the example list and selecting a puzzle via tap in `src/app/features/example-picker/example-picker.component.ts`/`.html`/`.scss` produces the same board update as on desktop (FR-007)
- [X] T022 [P] [US3] Verify (and adjust touch target sizing if needed) that tapping "Solve Next Digit" in `src/app/features/solve-controls/solve-controls.component.ts`/`.html`/`.scss` fills exactly one digit, matching desktop behavior (FR-007)
- [X] T023 [P] [US3] Verify (and adjust touch target sizing if needed) that tapping "Reset" in `src/app/features/solve-controls/solve-controls.component.ts`/`.html`/`.scss` clears user-entered digits while preserving given digits, matching desktop behavior (FR-007)
- [X] T024 [US3] Add TSDoc/comment updates for any adjustments made in T021-T023, per Constitution Principle I (NON-NEGOTIABLE)

**Checkpoint**: All three user stories are independently functional — the full mobile feature set from spec.md is implemented.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Automated coverage and final validation across all three user stories

- [X] T025 [P] Add Playwright mobile-viewport e2e scenarios in `e2e/mobile-client-support.spec.ts`, using the T002 device/360px projects, covering: grid+controls fit with no horizontal scroll at 360px and "Solve All" completes (US1); tap-to-select → keypad appears → tap digit → conflict highlight → Clear (US2); example selection, "Solve Next Digit", and "Reset" parity with desktop (US3)
- [X] T026 [P] Add unit/component tests for `DigitKeypadComponent` in `src/app/features/digit-keypad/digit-keypad.component.spec.ts`, covering visibility rules (compact + non-given selected cell), digit-tap/clear-tap forwarding to `PuzzleStore.setCellValue`, and ARIA labels on each button
- [X] T027 [P] Add unit tests for `ViewportService` in `src/app/core/state/viewport.service.spec.ts`, covering that `isCompactViewport$` emits `true`/`false` correctly across the T001 breakpoint
- [X] T028 Perform a documentation consistency pass across all new/changed files from this feature (`ViewportService`, `DigitKeypadComponent`, updated SCSS/components), confirming TSDoc coverage left by T004/T009/T020/T024 and filling any gaps found, per Constitution Principle I (NON-NEGOTIABLE)
- [X] T029 Run the full quickstart.md validation pass (`ng test`, `npm run e2e`, manual DevTools check at 360px and a tablet width in both orientations) and confirm every quickstart.md scenario and spec.md Success Criteria item (SC-001 through SC-005) passes, alongside re-running `specs/001-sudoku-solver/quickstart.md`'s existing scenarios to confirm no regression to the desktop experience

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001's breakpoint value) - BLOCKS User Story 2 (needs `ViewportService`) and is used by User Story 1's manual CSS rules too, so no story should start before it
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - Can proceed in priority order (US1 → US2 → US3, matching P1 → P1 → P2), or in parallel if staffed, since each story only touches its own components/styles on top of the shared `PuzzleStore`/`ViewportService`
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Pure CSS/breakpoint work on existing components; no dependency on US2/US3
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Needs `ViewportService` (T003) from Foundational; independently testable via its own acceptance scenarios without US1's CSS polish or US3 being complete
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Mostly verification/touch-target adjustments to existing components; independently testable without US1/US2 code changes, though it is most meaningfully verified once US1's layout work (Phase 3) has landed

### Within Each User Story

- Component/service scaffolding before wiring/behavior tasks (e.g., T010 before T011-T017)
- Documentation task last in each phase, after all other tasks in that phase
- Story complete before moving to next priority (if working sequentially)

### Parallel Opportunities

- T002 (Playwright config) can run in parallel with T001 (SCSS breakpoint) in Setup
- T007 (solve-controls/example-picker CSS review) can run in parallel with T006 (board CSS) within US1
- T010 (keypad scaffold) can start in parallel with any US1 task once Foundational is done, since US1 and US2 touch different files
- T021, T022, T023 (US3 verification tasks) can all run in parallel — each touches a different component
- T025, T026, T027 (Polish test tasks) can all run in parallel — each touches a different test file

---

## Parallel Example: User Story 3

```bash
# Launch all US3 verification tasks together (different components/files):
Task: "Verify example selection touch parity in src/app/features/example-picker/example-picker.component.ts/.html/.scss"
Task: "Verify Solve Next Digit touch parity in src/app/features/solve-controls/solve-controls.component.ts/.html/.scss"
Task: "Verify Reset touch parity in src/app/features/solve-controls/solve-controls.component.ts/.html/.scss"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks US2; recommended before US1 too, for a consistent breakpoint source)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Load the app at 360px width, confirm layout and "Solve All" work
5. Deploy/demo if ready — the app is now at least viewable and solvable on mobile, even before touch digit entry exists

### Incremental Delivery

1. Complete Setup + Foundational → breakpoint + `ViewportService` ready
2. Add User Story 1 → Test independently → Deploy/Demo (mobile-viewable MVP)
3. Add User Story 2 → Test independently → Deploy/Demo (touch digit entry works)
4. Add User Story 3 → Test independently → Deploy/Demo (full feature parity confirmed)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (CSS/layout)
   - Developer B: User Story 2 (`DigitKeypadComponent`)
   - Developer C: User Story 3 (verification/adjustments)
3. Stories complete and integrate independently; converge in Polish (Phase 6)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No new `PuzzleStore`/`Puzzle`/`Cell` fields or methods are introduced by this feature (see data-model.md) — all story work is additive UI/CSS on top of the existing `001-sudoku-solver` foundation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Phase 7: Convergence

**Purpose**: Close gaps found by `/speckit-converge` between spec.md/plan.md and the code as implemented through Phase 6

- [X] T030 [US2] Add a mechanism (e.g., a document/outside-click listener in `AppComponent` or `BoardComponent`) that calls `PuzzleStore.selectCell(null)` when the user taps/clicks outside the sudoku grid, so the on-screen keypad hides per US2/AC5 ("tap outside the grid... Then the keypad follows the newly selected cell (or hides if no cell is selected)") (missing)
- [X] T031 [P] Add a Playwright e2e test in `e2e/mobile-client-support.spec.ts` (or a new spec) simulating rapid sequential taps on multiple sudoku cells and multiple on-screen keypad digits, asserting every tap registers exactly once with no dropped or duplicated digit entries, per FR-010 (missing)
- [X] T032 [P] Add a test asserting that a single keypad tap both enters the digit into the selected cell and (when it creates a conflict) shows the conflict highlight within the same synchronous update, on a keypad button sized at least 44x44 CSS pixels, per SC-003 (missing)
- [X] T033 [P] Reconcile `DigitKeypadComponent`'s button implementation with plan.md's Technical Context, which states keypad buttons use `MatButtonModule`: either adopt `MatButtonModule` for the digit/clear buttons in `digit-keypad.component.html`/`.ts`, or add a TSDoc note in `digit-keypad.component.ts` explaining why plain `<button>` elements were used instead (contradicts)

**Checkpoint**: All four items above are resolved and verified (new/updated tests passing) before considering Mobile Client Support fully converged with its spec and plan.
