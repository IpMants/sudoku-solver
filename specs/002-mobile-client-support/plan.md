# Implementation Plan: Mobile Client Support

**Branch**: `002-mobile-client-support` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-mobile-client-support/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Extend the existing Angular Sudoku Solver so it works fully on mobile browsers.
Two concrete gaps exist today: (1) the app shell's sidebar+main layout has no
mobile breakpoint, so it does not reliably stack/fit on phone-width viewports
even though the grid itself already scales down (`board.component.scss`); and
(2) digit entry only works via a physical-keyboard `keydown` listener on the
grid (`BoardComponent.onGridKeydown`) — there is no touch-friendly way to enter
a digit. This feature adds a new `DigitKeypadComponent` (on-screen 1-9 + clear
keypad, ≥44x44px CSS-pixel touch targets, ARIA-labeled) that appears near the
selected cell on mobile-width viewports and calls the existing
`PuzzleStore.setCellValue`/`selectCell` methods — no changes to the store
contract are needed. Physical-keyboard entry continues to work unchanged
(already satisfies FR-003a). Responsive CSS breakpoints are added to
`app.component.scss` (currently empty) so the layout stacks and remains usable
from 360px phone widths through tablet and existing desktop widths.

## Technical Context

**Language/Version**: TypeScript 5.x on Angular 18 (matches the existing
`001-sudoku-solver` app; this feature extends it, no new project).

**Primary Dependencies**: Angular (`@angular/core`, `@angular/common`), Angular
Material + CDK (`MatButtonModule` for keypad buttons; CDK `BreakpointObserver`
or plain CSS media queries for the mobile/desktop layout switch), RxJS. No new
runtime dependency is required.

**Storage**: N/A — unchanged from `001-sudoku-solver` (in-memory `PuzzleStore`
state only; no persistence).

**Testing**: Jasmine + Karma (Angular CLI unit/component tests) for the new
`DigitKeypadComponent` and updated layout logic; Playwright for the mobile
viewport end-to-end scenarios in `quickstart.md` (using Playwright's device
emulation, e.g. `devices['iPhone 13']`, and a 360px custom viewport).

**Target Platform**: Modern mobile browsers (current Chrome, Safari on
Android/iOS) in addition to the existing desktop browser support; still a
static, backend-free web app (Constitution Principle II).

**Performance Goals**: Same responsiveness targets as `001-sudoku-solver`
(solve actions non-blocking, <500ms perceptible operations); keypad tap-to-
digit-entry MUST feel instantaneous (single synchronous `setCellValue` call,
no added latency).

**Constraints**: Touch targets MUST be ≥44x44 CSS pixels (Clarifications);
layout MUST fit 360px-wide viewports without horizontal scroll/zoom (FR-001,
SC-001); on-screen keypad MUST NOT rely on/trigger the device's native virtual
keyboard (Edge Cases); physical/paired keyboard entry MUST keep working on
mobile (FR-003a) — already true via the existing `onGridKeydown` handler, so
no change needed there; keypad and cells MUST be ARIA-labeled for assistive
technology (FR-003b) — cells already are (`board.component.html`), the new
keypad buttons must be too.

**Scale/Scope**: UI-only extension of the existing single-page app — one new
feature component (`digit-keypad`), CSS breakpoint additions to
`app.component.scss` (currently empty) and `board.component.scss`; no new
entities, no new backend, no new solver logic.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Full Documentation (NON-NEGOTIABLE) | New `DigitKeypadComponent` and any modified methods will carry TSDoc comments (purpose/params/behavior), matching the existing codebase's documentation style. | PASS |
| II. Browser-Native Client-Side Application | Purely a client-side UI addition (new component + CSS); no backend, no network calls introduced. | PASS |
| III. Test-First Solver Correctness (NON-NEGOTIABLE) | No solver/validator logic is changed by this feature (solving algorithm untouched); existing solver tests remain authoritative. Not applicable to new work beyond re-running existing suite to confirm no regression. | PASS (N/A for new code) |
| IV. Responsive Performance | Keypad taps synchronously call the existing, already-async-safe `setCellValue`/`solveAll`/`solveNextDigit` store methods; no new blocking work is introduced on the main thread. | PASS |
| V. Accessible, Usable Interface | New keypad buttons get explicit ARIA labels (e.g., "Enter 5", "Clear cell") and ≥44x44px touch targets; existing keyboard operability (`onGridKeydown`) and cell ARIA labeling are preserved unchanged; responsive layout extended down to 360px per FR-001/SC-001/SC-005. | PASS |

No violations identified; Complexity Tracking table is not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-mobile-client-support/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Same Angular CLI single workspace as 001-sudoku-solver; this feature adds
# one new feature component and extends existing styles — no new projects,
# no backend.
src/
├── app/
│   ├── core/
│   │   ├── models/            # unchanged (Cell, Puzzle, ExamplePuzzle)
│   │   ├── solver/             # unchanged
│   │   ├── validator/          # unchanged
│   │   └── state/              # unchanged (PuzzleStore contract reused as-is)
│   ├── features/
│   │   ├── board/              # existing grid component; CSS breakpoints extended
│   │   ├── example-picker/     # unchanged
│   │   ├── solve-controls/     # unchanged
│   │   └── digit-keypad/       # NEW: on-screen touch keypad component
│   ├── app.component.ts        # layout wiring: shows/positions digit-keypad
│   ├── app.component.html
│   └── app.component.scss      # NEW: responsive breakpoints for app shell (currently empty)
├── assets/
└── styles/

e2e/                             # existing Playwright suite; new mobile-viewport specs added
```

Unit and component tests are colocated with their source files following
Angular convention (`*.spec.ts` next to the file under test), matching
`001-sudoku-solver`.

**Structure Decision**: Continue using the single Angular CLI workspace from
`001-sudoku-solver` (no new project/backend). The new `digit-keypad` feature
component sits alongside `board`, `example-picker`, and `solve-controls`, and
consumes the existing `PuzzleStore` (`setCellValue`, `selectCell`,
`puzzle$.selectedIndex`) — no store contract changes are required, since
`selectCell`/`setCellValue` were already designed in `001-sudoku-solver` to
support exactly this kind of external UI trigger.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — table omitted.

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design (data-model.md, contracts/digit-keypad.md, quickstart.md).*

| Principle | Post-design confirmation | Status |
|---|---|---|
| I. Full Documentation (NON-NEGOTIABLE) | `contracts/digit-keypad.md` specifies a fully-documented (TSDoc-style) component contract; the same standard carries into implementation, matching `001-sudoku-solver`'s established pattern. | PASS |
| II. Browser-Native Client-Side Application | `data-model.md` confirms no new persisted entities/backend calls — the keypad is a pure client-side UI addition reading/writing only the existing in-memory `PuzzleStore`. | PASS |
| III. Test-First Solver Correctness (NON-NEGOTIABLE) | No solver/validator logic is touched by this design; `quickstart.md`'s automated checks only add UI/e2e coverage, leaving the existing test-first solver suite untouched and authoritative. | PASS (N/A for new code) |
| IV. Responsive Performance | `contracts/digit-keypad.md` requires synchronous, non-debounced calls into the already non-blocking `setCellValue`/`solveAll`/`solveNextDigit` methods — no new main-thread blocking work is introduced. | PASS |
| V. Accessible, Usable Interface | `contracts/digit-keypad.md` mandates `aria-label`s per button, ≥44x44px touch targets, no reliance on the native virtual keyboard, and preserves the existing keyboard-operable path (`onGridKeydown`) untouched; `quickstart.md` includes an explicit accessibility verification step. | PASS |

No violations identified after design; Complexity Tracking table remains not
required.
