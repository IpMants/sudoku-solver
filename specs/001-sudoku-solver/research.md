# Phase 0 Research: Sudoku Solver

All Technical Context fields were resolved without open `NEEDS CLARIFICATION`
markers, since the tech stack (Angular, Angular Material, TypeScript) was
specified directly by the user and the domain (classic 9x9 sudoku) is
well-established. This document records the rationale behind the key technical
decisions so they aren't relitigated during implementation.

## Decision: Angular CLI single workspace, no backend

- **Decision**: Deliver the feature as a single Angular CLI application with no
  server-side project.
- **Rationale**: Constitution Principle II mandates a browser-native,
  client-side-only application; the spec has no requirement that needs a
  backend (no login, no shared/multiplayer state, example puzzles bundled
  offline per Clarifications). Angular CLI's standard single-workspace layout
  is the simplest structure that satisfies this.
- **Alternatives considered**: Angular app + lightweight backend (e.g., for
  serving puzzles via API) — rejected because it adds an unnecessary server
  dependency and contradicts the "no live network call" clarification and the
  constitution's client-side mandate.

## Decision: Bundled static JSON for example puzzles

- **Decision**: Ship a curated set of ≥5 classic sudoku puzzles as static JSON
  assets under `src/assets/puzzles/`, loaded via Angular's `HttpClient` (same-
  origin static asset fetch, not a third-party network call) or a direct
  TypeScript import.
- **Rationale**: Confirmed via clarification — puzzles must work fully offline
  after initial load, with no live external fetch at runtime. Static bundled
  JSON satisfies FR-001/FR-002/FR-012 while keeping the app deployable as pure
  static assets (Constitution "Technology & Architecture Constraints").
- **Alternatives considered**: Fetching puzzles from a public third-party
  sudoku API at runtime — rejected per the Clarifications decision (adds a
  runtime network dependency and failure mode the spec explicitly avoids).

## Decision: Backtracking solver with constraint propagation, run off the main thread

- **Decision**: Implement solving as a constraint-propagation-assisted
  backtracking algorithm (e.g., naked/hidden singles elimination first, then
  backtracking search for remaining cells), executed inside a Web Worker (or
  chunked with async yielding if Web Worker packaging proves unnecessary for a
  9x9 board) so the UI thread never blocks.
- **Rationale**: Constitution Principle IV requires the UI to stay responsive
  and solves to complete in a "perceptible instant" (<500ms target); spec
  SC-002/SC-003 set concrete user-facing budgets (<2s for Solve All, <1s per
  Solve Next Digit click). Backtracking with constraint propagation is a
  standard, well-tested approach for classic 9x9 sudoku and comfortably meets
  these budgets. Clarification confirmed that when multiple solutions exist
  (possible for user-entered puzzles), the solver returns the first solution it
  finds, which fits naturally with a backtracking search that stops at the
  first complete valid assignment.
- **Alternatives considered**: Pure brute-force search without constraint
  propagation — rejected as unnecessarily slow on harder puzzles and closer to
  the edge of the responsiveness budget; exact-cover/Dancing Links (DLX) —
  more complex to implement and document than needed for a 9x9 board and
  rejected for simplicity (Constitution favors documented, understandable
  logic over premature optimization).

## Decision: Jasmine + Karma for unit/component tests, Playwright for e2e user-story flows

- **Decision**: Use Angular CLI's default Jasmine + Karma setup for solver,
  validator, and component unit tests; use **Playwright** (`@playwright/test`)
  for the cross-cutting user-story flows documented in `quickstart.md`,
  configured via `playwright.config.ts` at the repo root with tests under
  `e2e/`, driven by `npm run e2e`.
- **Rationale**: Constitution Principle III (Test-First, NON-NEGOTIABLE)
  requires tests before implementation for all solving/validation logic;
  Jasmine/Karma is the Angular CLI default, requiring no extra tooling
  decisions, and integrates directly with `ng generate`/`ng test`. An e2e layer
  is needed to verify full user journeys (e.g., "load app → see random puzzle →
  Solve All → see completed grid") end-to-end in a real browser context.
  Playwright was selected concretely (not left as "or equivalent") because it
  auto-manages browser binaries, has first-class TypeScript support matching
  the rest of the stack, and can start/stop the Angular dev server itself via
  its `webServer` option.
- **Alternatives considered**: Jest — a common Angular alternative, but Karma is
  the CLI default and avoids extra configuration; Cypress — a common e2e
  alternative, rejected in favor of Playwright's simpler multi-browser story
  and built-in test runner; no e2e tooling at all — rejected since several
  acceptance scenarios (e.g., default random puzzle on load) are most reliably
  verified in a real browser rather than at the unit level.

## Decision: Accessibility via Angular Material + explicit keyboard handling

- **Decision**: Build the grid and controls using Angular Material components
  (buttons, inputs/toggles, dialogs for the example picker) for built-in ARIA
  and focus-management support, adding explicit keyboard navigation (arrow keys
  between cells, digit key entry) for the custom sudoku grid itself, which is
  not a stock Material component.
- **Rationale**: Constitution Principle V requires full keyboard operability
  and assistive-technology support; Angular Material provides this out of the
  box for standard controls, but the 9x9 grid is a custom component that needs
  its own ARIA grid semantics and keyboard handling.
- **Alternatives considered**: Plain HTML `<table>`/`<div>` grid with no ARIA
  roles — rejected as it would fail Principle V's accessibility requirement.
- **Phasing**: Baseline ARIA grid roles (`role="grid"`/`"row"`/`"gridcell"`) and
  keyboard cell navigation/digit entry MUST be built together with the board
  component in User Story 1 (the MVP), not deferred to a later polish phase —
  Principle V is a MUST and applies to the first board a user can see and
  solve, so there is no accessibility-free increment to ship first. Only
  incremental refinements (e.g., live-region conflict announcements, fine-tuned
  focus-order polish) may be deferred to a later phase.

## Decision: Cell selection state lives on `Puzzle`, owned by `PuzzleStore` (FR-013 / US5)

- **Decision**: Add an optional `selectedIndex?: number` field to the `Puzzle`
  entity (alongside the existing `lastFilledIndex?: number` used for the
  "Solve Next Digit" highlight), and a new `PuzzleStore.selectCell(index)`
  method that sets it. `BoardComponent` renders the cell at `selectedIndex` as
  visually/`aria-selected` marked and updates it on click and on keyboard
  focus/arrow-key navigation. Every `PuzzleStore` action that replaces the
  puzzle wholesale (`loadRandomExample`, `loadExample`, `startCustomPuzzle`,
  `reset`) omits `selectedIndex` from the new `Puzzle` it publishes (clearing
  it), while actions that mutate the existing puzzle in place
  (`setCellValue`, `solveAll`, `solveNextDigit`) preserve the current
  `selectedIndex` unchanged.
- **Rationale**: `lastFilledIndex` already established the pattern of a
  single-index UI-highlight field living on `Puzzle` and managed by
  `PuzzleStore`, so reusing it for selection keeps a single source of truth
  (no separate, easy-to-desync piece of component state) and automatically
  gets the "cleared on puzzle change, preserved across solver fills" behavior
  required by FR-013 and its Edge Cases for free, the same way
  `lastFilledIndex` is already cleared/preserved by those same methods.
- **Alternatives considered**: Local component state (`selectedIndex` as a
  `BoardComponent` field) — rejected because the component would then need to
  detect "a genuinely new puzzle was loaded" (vs. an in-place mutation of the
  same puzzle) itself, requiring an extra identity/generation signal on
  `Puzzle` that the store-owned approach avoids entirely, since the store
  already knows which of its own methods represent a full replacement.
  A separate `SelectionStore`/service — rejected as unnecessary indirection
  for a single piece of UI state that is naturally scoped to the one `Puzzle`
  in play.
