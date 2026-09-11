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

## Decision: Keypad visibility/placement via CSS breakpoint + `selectedIndex`, not device/user-agent detection

- **Decision**: Show the on-screen keypad whenever a non-given cell is
  selected AND the viewport matches a "compact" CSS breakpoint (max-width
  consistent with the ≤~768px tablet/phone range agreed in Clarifications),
  implemented with a CSS media query (or Angular CDK `BreakpointObserver` bound
  to the same breakpoint) rather than `navigator.userAgent` sniffing.
- **Rationale**: Per Clarifications, the experience must be "a single
  responsive layout (no separate mobile app)" — the same page adapts by
  viewport size, which also correctly covers tablets in landscape and desktop
  browsers resized narrow, without fragile user-agent string parsing. This
  also means desktop users with touch-capable laptops still see the
  appropriate input method for their current window size.
- **Alternatives considered**: `navigator.userAgent`/`navigator.maxTouchPoints`
  detection — rejected as unreliable (spoofable, doesn't reflect window size)
  and explicitly not what "single responsive layout" calls for; always
  showing the keypad on all viewport sizes — rejected because it would add
  unnecessary UI clutter on desktop where the physical keyboard already works
  well (FR-003a preserves that path everywhere).

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
  it. The tradeoff is that the page's content shifts down when the keypad
  appears/disappears; this was judged an acceptable, and more correct,
  tradeoff than blocking real taps.
- **Alternatives considered**: A `position: fixed` bottom panel (the
  original decision) — rejected after e2e testing revealed it intercepts
  pointer events meant for controls it overlaps. CDK Overlay popover
  anchored to the exact selected cell — rejected as unnecessary complexity
  for a 9x9 grid where the keypad's target (any cell) could be anywhere on
  screen, and it has the same overlap risk as a fixed panel unless careful
  collision-avoidance logic is added.

## Decision: ARIA labeling for the keypad matches the existing cell-labeling pattern

- **Decision**: Each keypad button gets `aria-label="Enter {digit}"` (and
  `aria-label="Clear cell"` for the clear button); the keypad container gets
  `role="group"` with an `aria-label="Digit entry keypad"`, and it becomes
  `aria-hidden`/removed from the tab order when no non-given cell is selected.
- **Rationale**: Mirrors the existing `board.component.html` pattern of
  descriptive `aria-label`s per interactive element (Constitution Principle V,
  already established precedent in this codebase) and directly satisfies
  FR-003b for the newly introduced keypad.
- **Alternatives considered**: Relying on visible text alone ("1", "2", ...)
  with no `aria-label` — rejected as insufficient for screen reader users, who
  would otherwise hear only the raw digit without context that it acts on the
  currently selected cell.

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
