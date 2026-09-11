# Feature Specification: Mobile Client Support

**Feature Branch**: `002-mobile-client-support`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Update the existing feature. Add the support of mobile devices as clients. On the mobile devices the entering of the values within of the mobile browser should also work."

## Clarifications

### Session 2026-09-11

- Q: On a mobile browser, how should users enter digits into a sudoku cell? →
  A: Provide a touch-friendly on-screen digit keypad that appears when a cell is
  selected, so users never need to rely on the device's native keyboard.
- Q: Which mobile screen sizes must the experience explicitly support? → A:
  Support common phone screens down to 360px wide and tablet screens, using a
  single responsive layout (no separate "mobile app").
- Q: Should any existing functionality (example selection, Solve All, Solve Next
  Digit, Reset, real-time conflict validation) be reduced or hidden on mobile? →
  A: No — all existing functionality must remain fully available and behave the
  same way on mobile browsers as on desktop.

### Session 2026-09-11 (follow-up)

- Q: What minimum touch target size should the on-screen keypad's digit buttons
  use? → A: 44x44 CSS pixels (WCAG 2.5.5 / Apple HIG baseline).
- Q: If a mobile device has a physical or paired keyboard attached, must digit
  entry via that keyboard continue to work alongside the on-screen touch
  keypad? → A: Yes — keyboard entry must also work on mobile whenever a
  keyboard is attached, in addition to the on-screen keypad.
- Q: Should the on-screen keypad and sudoku cells be labeled for screen readers
  (e.g., announcing cell position and selected digit) on mobile browsers? → A:
  Yes — require ARIA/screen-reader labeling for the mobile keypad and cells,
  consistent with the existing accessibility principle.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Solve a Puzzle on a Mobile Browser (Priority: P1)

A visitor opens the application on a mobile phone's browser and is shown the same
ready-to-play classic sudoku puzzle as on desktop. They tap "Solve All" and see
the complete, correctly solved puzzle, with the grid and controls comfortably
readable and usable on the smaller screen.

**Why this priority**: Mobile is now a primary access point for the application;
without a working, comfortably usable experience on phones, a large share of
visitors cannot use the core value proposition at all.

**Independent Test**: Load the application in a mobile browser (or a
phone-sized viewport) with no prior interaction and tap "Solve All"; the puzzle
fills completely with a valid solution, and every control is visible without
horizontal scrolling or pinch-zooming.

**Acceptance Scenarios**:

1. **Given** a visitor opens the application in a mobile browser, **When** the
   page finishes loading, **Then** a randomly selected classic sudoku puzzle is
   displayed and the entire grid and its controls fit within the screen width
   without horizontal scrolling.
2. **Given** the default puzzle is displayed on a mobile browser, **When** the
   user taps "Solve All", **Then** every empty cell is filled with the correct
   digit and the puzzle shows a fully and correctly solved classic sudoku grid.
3. **Given** the application is open on a mobile browser, **When** the user
   rotates the device between portrait and landscape orientation, **Then** the
   puzzle grid and controls remain usable and correctly laid out.

---

### User Story 2 - Enter Custom Digits by Touch (Priority: P1)

A user on a mobile browser wants to enter their own sudoku puzzle from scratch,
or fill in specific cells of an example puzzle, using only touch — without a
physical keyboard.

**Why this priority**: Manual digit entry is a core capability of the existing
feature; on mobile this must work through touch interaction alone, since most
mobile browsers do not have an always-available physical keyboard suited to
quick single-digit numeric entry.

**Independent Test**: On a mobile browser (or phone-sized viewport with touch
emulation), tap an empty cell, select a digit from the on-screen keypad, and
confirm the digit appears in that cell; repeat for multiple cells to fill in a
custom puzzle.

**Acceptance Scenarios**:

1. **Given** a user taps an empty (non-given) cell on a mobile browser, **When**
   the cell becomes selected, **Then** an on-screen digit keypad (1-9 and a clear
   option) appears and is fully reachable and tappable on the screen.
2. **Given** the on-screen keypad is visible, **When** the user taps a digit,
   **Then** that digit is entered into the selected cell and the keypad remains
   available for entering the next cell.
3. **Given** a user has entered a digit into a cell that conflicts with another
   digit in the same row, column, or box, **When** the conflicting digit is
   entered, **Then** the conflict is highlighted immediately, matching the
   real-time validation behavior available on desktop.
4. **Given** a user taps the clear option on the on-screen keypad while a
   non-given cell is selected, **When** the option is tapped, **Then** the
   digit in that cell is removed.
5. **Given** a user is entering digits on a mobile browser, **When** they tap
   outside the grid or select a different cell, **Then** the keypad follows the
   newly selected cell (or hides if no cell is selected) without leaving stray
   input elements on screen.

---

### User Story 3 - Use All Existing Features on Mobile (Priority: P2)

A user on a mobile browser wants to use the same features already available on
desktop — choosing an example puzzle, solving the next digit only, and resetting
the board — with the same outcomes.

**Why this priority**: Consistency of functionality across devices avoids a
degraded "mobile-lite" experience and ensures the value of the existing feature
set is not lost for mobile users, though this is slightly less urgent than the
baseline solve and entry flows above.

**Independent Test**: On a mobile browser, open the example puzzle list, select
a puzzle, tap "Solve Next Digit" once, and tap "Reset"; confirm each action
produces the same result as on desktop.

**Acceptance Scenarios**:

1. **Given** the application is open on a mobile browser, **When** the user
   opens the list of example puzzles and selects one, **Then** the board updates
   to that puzzle's given digits, matching desktop behavior.
2. **Given** a puzzle is displayed on a mobile browser, **When** the user taps
   "Solve Next Digit", **Then** exactly one correct digit is filled in, matching
   desktop behavior.
3. **Given** the user has entered custom digits on a mobile browser, **When**
   they tap "Reset", **Then** all user-entered digits are cleared while given
   digits remain, matching desktop behavior.

---

### Edge Cases

- What happens when the on-screen keypad would overlap the selected cell or run
  off the edge of a very small screen? The keypad must reposition itself so it
  never covers the selected cell and stays fully within the visible viewport.
- How does the system handle a mobile browser's own virtual keyboard appearing
  unexpectedly (e.g., due to a focused text input)? The application must not
  rely on the device's native virtual keyboard for digit entry, so it should not
  be triggered by cell selection.
- How does the system handle rapid sequential taps on multiple cells or digits
  (fast touch input)? Each tap must be registered without dropped or duplicated
  input.
- What happens when the same application is used on a tablet-sized screen
  between phone and desktop breakpoints? The layout must scale smoothly without
  a broken or clipped grid at any width from 360px upward.
- What happens when a user switches from a mobile browser session to a desktop
  session (or vice versa) mid-puzzle, e.g., by continuing on another device?
  Each session's puzzle state follows the existing feature's behavior (no new
  cross-device sync is introduced by this feature).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the sudoku grid and all controls (example
  selector, Solve All, Solve Next Digit, Reset) in a layout that is fully usable
  on mobile browser viewports, including common phone widths starting at 360px,
  without requiring horizontal scrolling or manual zooming.
- **FR-002**: System MUST allow users to select any non-given cell via a single
  tap on a mobile browser.
- **FR-003**: System MUST present an on-screen touch keypad (digits 1-9 plus a
  clear/erase option) whenever a non-given cell is selected on a mobile browser,
  so digit entry does not depend on the device's native keyboard. Each keypad
  button MUST have a tappable target of at least 44x44 CSS pixels.
- **FR-003a**: System MUST continue to accept digit entry via a physical or
  paired keyboard on mobile browsers when one is attached, in addition to the
  on-screen keypad; the two input methods MUST be able to update the same
  selected cell.
- **FR-003b**: System MUST expose the on-screen keypad buttons and sudoku cells
  (including cell position and current value) to assistive technology via
  semantic HTML/ARIA labeling on mobile browsers, consistent with the
  accessibility requirements already applied on desktop.
- **FR-004**: System MUST enter the tapped digit into the currently selected
  cell immediately upon a keypad tap, and MUST clear a cell's digit when the
  keypad's clear option is tapped.
- **FR-005**: System MUST position the on-screen keypad so it remains fully
  visible within the viewport and does not obscure the currently selected cell.
- **FR-006**: System MUST apply the same real-time conflict validation and
  highlighting behavior to digits entered via touch on mobile as is applied to
  digits entered on desktop.
- **FR-007**: System MUST keep the example puzzle list, "Solve All", "Solve Next
  Digit", and "Reset" fully functional and behaviorally identical (in outcome)
  on mobile browsers as on desktop.
- **FR-008**: System MUST support both portrait and landscape orientations on
  mobile devices, keeping the grid and controls usable after an orientation
  change.
- **FR-009**: System MUST continue to require no login or account on mobile
  browsers, consistent with the existing feature.
- **FR-010**: System MUST register touch input (tap on cells, tap on keypad
  digits) reliably without dropped or duplicated entries during rapid
  sequential taps.

### Key Entities

- **Selected Cell**: The sudoku cell currently awaiting digit input on the
  active client (desktop or mobile); determines which cell the on-screen
  keypad's taps apply to on mobile.
- **On-Screen Keypad**: A touch-oriented control surfaced on mobile browsers
  offering digits 1-9 and a clear action, tied to the currently selected cell.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users on a mobile browser can fully solve a puzzle (via "Solve
  All") on the first attempt with no horizontal scrolling or zooming required,
  on screens as narrow as 360px wide.
- **SC-002**: Users on a mobile browser can enter a complete custom puzzle
  (all 81 cells reachable and enterable) using only touch input, with no need
  for a physical or the device's native keyboard.
- **SC-003**: 95% of single-tap digit entries on a mobile browser register
  correctly on the first tap on keypad buttons sized at least 44x44 CSS pixels,
  with conflicts highlighted immediately (within the same interaction) when
  they occur.
- **SC-004**: All existing desktop features (example selection, Solve All,
  Solve Next Digit, Reset) remain available and produce identical outcomes when
  used from a mobile browser.
- **SC-005**: The application layout remains usable (no clipped grid, no
  overlapping controls) across the full range from 360px-wide phone screens
  through common tablet widths and up to existing desktop widths.

## Assumptions

- "Mobile devices as clients" refers to using the application through a mobile
  device's web browser (responsive web experience), not a separate native
  mobile app or app-store distribution.
- The existing puzzle-solving logic, example puzzle set, and "no login
  required" behavior remain unchanged; this feature only extends the client
  experience to mobile browsers and adds a touch-based entry method.
- The on-screen keypad's digit buttons use a minimum touch target size of
  44x44 CSS pixels (WCAG 2.5.5 / Apple HIG baseline).
- Supported mobile browsers are the current versions of the major mobile
  browsers (e.g., Chrome, Safari) commonly used on phones and tablets; no
  legacy or niche browser support is required beyond what the existing feature
  already targets on desktop.
