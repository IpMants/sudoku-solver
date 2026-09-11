# Quickstart: Validating Mobile Client Support

This guide documents how to run and manually/automatically verify the mobile
client support feature end-to-end. It links to `data-model.md` and
`contracts/digit-keypad.md` instead of repeating implementation details.

## Prerequisites

- Node.js and npm installed (matches the existing `001-sudoku-solver` setup).
- Repository dependencies installed: `npm install`.
- Playwright browsers installed (first run only): `npx playwright install`.

## Run the app locally

```powershell
npm start
```

Open the printed local URL (default `http://localhost:4200`) in a desktop
browser first to confirm the baseline (`001-sudoku-solver`) experience still
works, then use one of the mobile-verification options below.

## Manually verify on a mobile-width viewport (desktop browser dev tools)

1. Open the app in Chrome/Edge/Firefox.
2. Open DevTools → toggle device toolbar / responsive design mode.
3. Set the viewport to 360px wide (a common small-phone width) and, separately,
   a common tablet width (e.g., 768px).
4. **User Story 1 (Solve on mobile)**: Confirm the puzzle grid and all
   controls (example picker, Solve All, Solve Next Digit, Reset) are fully
   visible with no horizontal scrollbar and no need to zoom. Tap "Solve All"
   and confirm the puzzle completes correctly. Rotate the viewport between
   portrait/landscape (DevTools "rotate" toggle) and confirm layout remains
   usable (FR-001, FR-008; SC-001, SC-005).
2. **User Story 2 (Touch digit entry)**: Tap an empty, non-given cell.
   Confirm the on-screen keypad (per `contracts/digit-keypad.md`) appears,
   is fully on-screen, and does not obscure the selected cell. Tap a digit;
   confirm it appears in the cell. Enter a digit that conflicts with another
   cell in the same row/column/box; confirm the conflict highlight appears
   immediately. Tap "Clear"; confirm the digit is removed. Tap a different
   cell; confirm the keypad follows the new selection (FR-002–FR-006,
   FR-003b; SC-002, SC-003).
3. **User Story 3 (Feature parity)**: On the same mobile-width viewport,
   select a different example puzzle, tap "Solve Next Digit" once, and tap
   "Reset"; confirm each behaves identically to desktop (FR-007; SC-004).
4. **Physical keyboard fallback (FR-003a)**: With a physical keyboard attached
   (or DevTools focus + real key presses) at a mobile-width viewport, focus a
   cell and type a digit key; confirm it is entered the same way as on
   desktop, alongside the on-screen keypad.
5. **Accessibility (FR-003b)**: Using a screen reader (or the browser's
   accessibility tree inspector), confirm each keypad button announces a
   clear label (e.g., "Enter 5", "Clear cell") and that cells continue to
   announce position/value/conflict state as in `001-sudoku-solver`.

## Automated verification (Playwright)

```powershell
npm run e2e
```

This runs the existing Playwright suite plus the new mobile-viewport
scenarios (device emulation and a 360px custom viewport, per `research.md`'s
Playwright decision), covering:

- Grid and controls fit without horizontal scroll at 360px (User Story 1).
- Tap-to-select → on-screen keypad → tap digit → cell updates, including the
  real-time conflict highlight (User Story 2).
- Example selection, Solve Next Digit, and Reset behave the same on a mobile
  viewport as on desktop (User Story 3).

## Expected outcome

All scenarios above pass with no horizontal scrolling, no reliance on the
device's native virtual keyboard, and no regression to the existing desktop
experience (see `specs/001-sudoku-solver/quickstart.md` for the baseline
desktop validation flow, which MUST continue to pass unchanged).
