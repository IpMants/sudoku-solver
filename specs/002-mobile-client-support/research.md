# Phase 0 Research: Mobile Client Support

All Technical Context fields were resolved without open `NEEDS CLARIFICATION`
markers: this feature extends the existing `001-sudoku-solver` Angular app
(same stack, same constitution), and the three ambiguities raised during
`/speckit-clarify` (touch target size, keyboard fallback on mobile, ARIA
labeling of the keypad) are already answered in `spec.md`'s Clarifications.
This document records the rationale behind the remaining technical decisions.

## Decision: Add a dedicated `DigitKeypadComponent` driven by existing `PuzzleStore` state

- **Decision**: Build a new, standalone Angular component (`features/digit-
  keypad`) that subscribes to `PuzzleStore.puzzle$`, renders when
  `puzzle.selectedIndex` is a non-given cell, and calls the existing
  `PuzzleStore.setCellValue(index, digit | null)` on tap — no new store
  methods or data-model fields are introduced.
- **Rationale**: `001-sudoku-solver`'s `PuzzleStore.selectCell`/`setCellValue`
  contract was already designed to be triggered by "a mouse click and a
  keyboard-driven focus change" alike (`puzzle-store.md`); a touch tap is just
  a third trigger of the same contract, so no backend/state redesign is
  needed. Keeping the keypad as its own component (rather than inlining
  buttons into `BoardComponent`) keeps the grid component focused on
  rendering/navigation and makes the keypad independently unit-testable.
- **Alternatives considered**: Extending `BoardComponent` directly with keypad
  markup — rejected as it would bloat an already-documented component and mix
  two concerns (grid rendering/keyboard navigation vs. touch input widget).
  A native `<input type="number">` per cell — rejected because mobile OS
  numeric keyboards vary in layout/behavior and the Clarifications explicitly
  require an app-controlled on-screen keypad, not the device's native
  keyboard.

## Decision: Keypad rendering via CSS breakpoint (always-on); interactivity gated by `selectedIndex`

- **Decision (revised 2026-09-14 per Clarifications)**: Render the on-screen
  keypad whenever the viewport matches a "compact" CSS breakpoint (max-width
  consistent with the ≤~768px tablet/phone range agreed in Clarifications),
  **regardless of whether a cell is selected** — implemented with a CSS media
  query (or Angular CDK `BreakpointObserver` bound to the same breakpoint)
  rather than `navigator.userAgent` sniffing. Whether the keypad is
  *interactive* (vs. visually dimmed/`disabled`) is a separate, second
  condition: interactive only while `puzzle.selectedIndex` references a cell
  whose `origin !== 'given'`.
- **Rationale**: Per the 2026-09-14 clarification, users on mobile must
  always be able to see that a keyboard-free entry method exists, without
  first having to select a cell to discover it — this reduces first-time-use
  confusion and matches the request that "the alternative method [...] always
  show[s]." Splitting *rendering* (breakpoint-only) from *interactivity*
  (selection-dependent) keeps the existing `PuzzleStore` contract and
  `setCellValue`/`selectCell` reuse from the prior decision unchanged; only
  the component's own view-state derivation changes (`visible` becomes
  breakpoint-only, a new `interactive`/`disabled` flag is added). Per
  Clarifications, the experience must still be "a single responsive layout
  (no separate mobile app)" — the same page adapts by viewport size, which
  also correctly covers tablets in landscape and desktop browsers resized
  narrow, without fragile user-agent string parsing.
- **Alternatives considered**: `navigator.userAgent`/`navigator.maxTouchPoints`
  detection — rejected as unreliable (spoofable, doesn't reflect window size)
  and explicitly not what "single responsive layout" calls for; leaving taps
  on a disabled keypad as silent no-ops with no visual state change —
  rejected during clarification in favor of an explicit dimmed/disabled
  visual state, since a silently inert control risks users thinking the
  keypad is broken; auto-selecting the first empty cell on tap — rejected as
  a surprising, non-obvious side effect for a simple digit tap.

## Decision: Keypad positioning follows the selected cell within the viewport (no native browser keyboard involved)

- **Decision (revised during implementation)**: Render the keypad in normal
  document flow directly below the board (and above the solve controls),
  rather than as a `position: fixed` overlay panel. An initial fixed-panel
  implementation was validated against the Playwright mobile e2e suite and
  found to visually cover, and intercept taps intended for, the "Solve All"/
  "Solve Next Digit"/"Reset" buttons and other cells whenever it was open —
  a fixed overlay's guarantee of "never covers the selected cell" does not
  extend to "never covers any other control." Normal flow avoids this class
  of bug entirely: every sibling element reflows around the keypad instead
  of being covered by it.
- **Rationale**: Satisfies the Edge Case requirement that the keypad "must
  reposition itself so it never covers the selected cell and stays fully
  within the visible viewport" — a normal-flow element by definition never
  overlaps its siblings — while being simpler and more predictable than
  precise per-cell popover placement (which would need to recompute on every
  selection and handle 81 different anchor points), and without the fixed-
  position overlay's failure mode of blocking taps on the controls beneath
  it. Since the 2026-09-14 clarification made the keypad always-rendered on
  compact viewports (see the visibility decision above), it no longer
  appears/disappears at all — it occupies a stable slot in the layout from
  first paint, eliminating the earlier "content shifts down when the keypad
  appears/disappears" tradeoff entirely, in addition to avoiding the overlap
  bug.
- **Alternatives considered**: A `position: fixed` bottom panel (the
  original decision) — rejected after e2e testing revealed it intercepts
  pointer events meant for controls it overlaps. CDK Overlay popover
  anchored to the exact selected cell — rejected as unnecessary complexity
  for a 9x9 grid where the keypad's target (any cell) could be anywhere on
  screen, and it has the same overlap risk as a fixed panel unless careful
  collision-avoidance logic is added.

## Decision: ARIA labeling for the keypad matches the existing cell-labeling pattern

- **Decision (revised 2026-09-14)**: Each keypad button gets `aria-label="Enter
  {digit}"` (and `aria-label="Clear cell"` for the clear button); the keypad
  container gets `role="group"` with an `aria-label="Digit entry keypad"`.
  Since the keypad now always renders on compact viewports, it is **never**
  `aria-hidden`/removed from the tab order; instead, each button gets the
  native `disabled` attribute (which already conveys "not currently
  interactive" to assistive technology without hiding the control) whenever
  no editable cell is selected, and a `dimmed`/reduced-opacity visual style
  reinforces the same state sighted users.
- **Rationale**: Mirrors the existing `board.component.html` pattern of
  descriptive `aria-label`s per interactive element (Constitution Principle V,
  already established precedent in this codebase) and directly satisfies
  FR-003b for the newly introduced keypad. Using `disabled` (rather than
  `aria-hidden` or removal) keeps the keypad discoverable by screen-reader
  users who explore the page before selecting a cell — consistent with the
  "always show the alternative method" clarification — while still
  communicating that it is not yet actionable.
- **Alternatives considered**: Relying on visible text alone ("1", "2", ...)
  with no `aria-label` — rejected as insufficient for screen reader users, who
  would otherwise hear only the raw digit without context that it acts on the
  currently selected cell. Keeping the earlier `aria-hidden`-when-empty
  approach — rejected because it would make the always-visible keypad
  invisible to assistive technology exactly when the clarification requires
  it to be discoverable.

## Decision: Playwright device emulation for mobile e2e coverage

- **Decision**: Extend the existing Playwright suite (`e2e/`,
  `playwright.config.ts`) with additional scenarios/projects using Playwright's
  built-in device presets (e.g., `devices['iPhone 13']`, a Pixel preset) plus a
  raw 360px-wide custom viewport, to validate the mobile-specific acceptance
  scenarios from `spec.md` (touch tap → keypad → digit entered; layout fits
  without horizontal scroll).
- **Rationale**: `001-sudoku-solver`'s `research.md` already chose Playwright
  for cross-cutting user-story flows; Playwright's device emulation (touch
  events, viewport size, user-agent) is built in and requires no new tooling
  dependency, keeping this feature's testing story consistent with the
  existing one.
- **Alternatives considered**: Manual/real-device testing only — rejected as
  non-repeatable and not automatable in CI; a separate mobile-testing
  framework (e.g., Appium) — rejected as this is a responsive web app, not a
  native app, so browser-level emulation is sufficient and avoids adding an
  unrelated testing stack.
