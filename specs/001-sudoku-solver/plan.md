# Implementation Plan: Sudoku Solver

**Branch**: `001-sudoku-solver` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-sudoku-solver/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

A browser-only, single-user Sudoku Solver: on load it shows a random puzzle from a
bundled offline set of classic 9x9 sudoku examples; users may pick a different
bundled example, or start a blank grid and enter their own puzzle. "Solve All"
fills in a full correct solution and "Solve Next Digit" reveals one correct digit
at a time; real-time rule-conflict validation prevents solving invalid puzzles.
Clicking (or keyboard-focusing) any cell visually marks it as the single
"selected" cell, so the user always knows which cell their next typed digit
will go into (FR-013 / User Story 5); the selection persists through solver
fills but is cleared whenever the displayed puzzle changes.
Built with Angular, Angular Material, and TypeScript as a static client-side app
with no backend and no login, per the project constitution.
Separately, the repository's `README.md` MUST link to the deployed demo
(`https://ipmants.github.io/sudoku-solver/`) and state that the project was
generated completely with AI (GitHub Copilot) via Spec-Driven Development (SDD)
using the GitHub Spec Kit framework, linking to
`https://github.github.com/spec-kit` (FR-014/FR-015 / User Story 6). This is a
documentation-only requirement with no runtime/architecture impact and is
already implemented in `README.md`; it needs no design artifacts beyond a
quickstart validation step.

## Technical Context

**Language/Version**: TypeScript 5.x on Angular 18 (latest Angular LTS at time of
writing), targeting evergreen browsers (ES2022 output).

**Primary Dependencies**: Angular (`@angular/core`, `@angular/router`), Angular
Material + Angular CDK (UI components, accessibility primitives), RxJS (reactive
state/events). No server-side framework.

**Storage**: N/A — no persistence required (no login, no cross-session save per
spec Assumptions). Bundled example puzzles are static JSON assets shipped with the
app; a puzzle in progress lives only in in-memory Angular component/service state
for the current page session.

**Testing**: Jasmine + Karma (Angular CLI default unit/component test runner) for
solver logic and components; Playwright (or Angular's e2e tooling) for the
end-to-end user-story scenarios in `quickstart.md`.

**Target Platform**: Modern desktop and mobile web browsers via static hosting
(no server runtime required); must work fully offline after the initial page
load (Constitution Principle II).

**Project Type**: Single front-end web application (Angular CLI workspace) — no
backend project, per Constitution Principle II and the spec's no-login scope.

**Performance Goals**: Initial puzzle visible within 1s of load (SC-001); "Solve
All" completes within 2s (SC-002); each "Solve Next Digit" click resolves within
1s (SC-003); UI thread stays responsive during solving (Constitution Principle
IV, target <500ms perceptible per operation).

**Constraints**: Must run with no backend and no live network calls at runtime
(offline-capable, bundled example puzzles per Clarifications); no user
accounts/login (FR-008); solving MUST NOT block the browser main thread
noticeably; UI MUST be keyboard-operable and expose ARIA semantics (Constitution
Principle V) — this is a baseline requirement of the very first shippable
increment (User Story 1 / MVP), not a deferred polish item, because Principle V
is a MUST that applies to any board the user can see and solve; all public
functions/classes/modules MUST carry TSDoc comments (Constitution Principle I).

**Scale/Scope**: Single-user, single-page client app; one 9x9 grid in play at a
time; at least 5 bundled example puzzles across difficulty levels (FR-012, SC-006);
small surface area — puzzle board, example picker, custom-entry mode, and two
solve actions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Full Documentation (NON-NEGOTIABLE) | All solver, service, and component code will carry TSDoc comments explaining purpose/params/returns; non-obvious solving logic (constraint propagation/backtracking) gets inline comments. Enforced via code review checklist in tasks. | PASS |
| II. Browser-Native Client-Side Application | Angular app compiles to static HTML/CSS/JS; no server-side backend is introduced; example puzzles are bundled static assets, not a live API. | PASS |
| III. Test-First Solver Correctness (NON-NEGOTIABLE) | Solver/validator logic (`core/solver`, `core/validator`) will be developed with Jasmine unit tests written first, covering valid puzzles, unsolvable puzzles, and edge cases (empty board, multiple solutions), before implementation, per Phase 1 data model and tasks. | PASS |
| IV. Responsive Performance | Solving runs off the main UI thread (Web Worker or chunked async computation) so the grid/UI remain interactive; performance targets from spec SC-002/SC-003 are carried into Technical Context. | PASS |
| V. Accessible, Usable Interface | Angular Material components (built-in ARIA support) plus explicit keyboard handling for the sudoku grid; responsive layout via Angular Material's layout utilities for desktop/mobile. Baseline ARIA grid roles and keyboard cell navigation/entry MUST be built together with the board component in User Story 1 (the MVP), not deferred to a later polish phase — any responsive-layout refinement beyond the baseline MAY be deferred. The visible cell-selection marker (FR-013/US5) reinforces this principle by giving keyboard and pointer users alike an unambiguous, always-in-sync indication of the currently focused/active cell. | PASS |

No violations identified; Complexity Tracking table is not required.

**MVP scope note**: Because Principle V is a MUST that applies to the initial
board (there is no "accessibility-free" board to ship first), the smallest
valid MVP is User Story 1 *plus* baseline keyboard/ARIA support for the grid —
not User Story 1 alone. `/speckit-tasks` MUST place baseline accessibility work
inside the User Story 1 phase (not Polish) so every checkpoint, including the
first one, is constitution-compliant.

## Project Structure

### Documentation (this feature)

```text
specs/001-sudoku-solver/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Option 2 (Angular CLI single workspace): the whole repo IS the Angular app;
# there is no separate backend project, per Constitution Principle II.
src/
├── app/
│   ├── core/
│   │   ├── models/            # Puzzle, Cell, ExamplePuzzle types
│   │   ├── solver/            # solving algorithm (backtracking/constraint propagation)
│   │   └── validator/         # classic sudoku rule-conflict validation
│   ├── features/
│   │   ├── board/             # sudoku grid component (display + cell entry)
│   │   ├── example-picker/    # browse/select bundled example puzzles
│   │   └── solve-controls/    # "Solve All" / "Solve Next Digit" / reset actions
│   ├── shared/                # shared Angular Material wrappers, pipes, directives
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/
│   └── puzzles/               # bundled example puzzles as static JSON
├── styles/
└── main.ts

e2e/                            # end-to-end scenarios validating quickstart.md flows
```

Unit and component tests are colocated with their source files following Angular
convention (`*.spec.ts` next to the file under test, e.g.,
`src/app/core/solver/solver.spec.ts`).

**Structure Decision**: Single Angular CLI workspace (Option 2 variant with no
separate backend) is used because the entire application is a client-side-only
web app per Constitution Principle II — there is no backend project to place
alongside it. Solver and validator logic live in `core/` so they stay isolated
from UI rendering code and can be unit-tested independently of the DOM, per the
Technology & Architecture Constraints section of the constitution.

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design (data-model.md, contracts/, quickstart.md).*

| Principle | Post-design confirmation | Status |
|---|---|---|
| I. Full Documentation (NON-NEGOTIABLE) | `contracts/solver-service.md` and `contracts/puzzle-store.md` define fully-documented (TSDoc-style) interfaces; the same documentation standard carries into implementation. | PASS |
| II. Browser-Native Client-Side Application | `data-model.md` confirms Storage = N/A / in-memory only; `ExamplePuzzleProvider` is synchronous and reads bundled static assets — no backend or live network call introduced by the design. | PASS |
| III. Test-First Solver Correctness (NON-NEGOTIABLE) | `contracts/solver-service.md` specifies concrete "Contract test expectations" (valid, unsolvable, multiple-solution, already-solved, conflicting-grid cases) to be written before implementation. | PASS |
| IV. Responsive Performance | `contracts/solver-service.md` requires `solveAll`/`solveNextDigit` to be asynchronous and non-blocking, matching the Web Worker/chunked-async approach from `research.md`. | PASS |
| V. Accessible, Usable Interface | Design keeps grid/board as its own component (`features/board`) so custom ARIA grid semantics and keyboard handling can be added there, on top of Angular Material for standard controls. `research.md`'s Accessibility decision confirms this ships with the board component itself (User Story 1), not as a separate later addition. `data-model.md`'s `Puzzle.selectedIndex` field and `contracts/puzzle-store.md`'s `selectCell` method keep the visible selection marker synchronized with keyboard focus/ARIA `aria-selected` state, satisfying FR-013 without introducing a second source of truth. | PASS |

No violations identified after design; Complexity Tracking table remains not
required.
