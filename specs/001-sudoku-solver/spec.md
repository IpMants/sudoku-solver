# Feature Specification: Sudoku Solver

**Feature Branch**: `001-sudoku-solver`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "Develop Sudoku-Solver, an application which is able to solve any classic sudoku. As test input some sudoku examples should be taken from internet and the user should be able to choose one of them. By default any random example should be taken at the beginning. The user should be also able to enter its own sudoku from scratch. Some solve buttons should be provided: Solve All, Solve Next Digit. The login is not required."

## Clarifications

### Session 2026-09-09

- Q: Should the example sudoku puzzles be fetched live from the internet each
  time, or bundled with the app ahead of time so it works fully offline? → A:
  Bundle a curated, pre-collected set of example puzzles with the app (no live
  network call).
- Q: When a custom puzzle entered by the user has more than one valid solution,
  which one should the app show? → A: Show any one valid solution (first one
  found), without flagging that other solutions may exist.
- Q: Should the app check for rule conflicts (duplicate digits) as soon as the
  user types each digit, or only when they click a solve button? → A: Validate
  in real time as each digit is entered, highlighting conflicts immediately.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instantly Solve the Default Puzzle (Priority: P1)

A visitor opens the application and is immediately shown a ready-to-play classic
sudoku puzzle (no setup, no login). They click "Solve All" and see the complete,
correctly solved puzzle.

**Why this priority**: This is the core value proposition of the product — solving
a sudoku — and it must work with zero friction the moment someone arrives. It is
the minimum viable experience.

**Independent Test**: Load the application with no prior interaction and click
"Solve All"; the puzzle fills completely with a valid solution, with no login or
setup required.

**Acceptance Scenarios**:

1. **Given** a visitor opens the application for the first time, **When** the page
   finishes loading, **Then** a randomly selected classic sudoku puzzle is already
   displayed and ready to solve.
2. **Given** the default puzzle is displayed, **When** the user clicks "Solve All",
   **Then** every empty cell is filled with the correct digit and the puzzle shows
   a fully and correctly solved classic sudoku grid.
3. **Given** the user reloads the application, **When** the page loads again,
   **Then** a puzzle is shown without requiring any account creation or sign-in.

---

### User Story 2 - Choose a Specific Example Puzzle (Priority: P2)

A user wants to practice with or solve a specific puzzle rather than the randomly
chosen default, so they browse a list of example puzzles and pick one to load onto
the board.

**Why this priority**: Builds directly on the default experience by giving users
control and variety, which is explicitly requested, but the app is still useful
without it (the random default already provides a puzzle).

**Independent Test**: From the example list, select a puzzle other than the one
currently displayed and confirm the board updates to show exactly that puzzle's
given digits.

**Acceptance Scenarios**:

1. **Given** the application is displaying any puzzle, **When** the user opens the
   list of example puzzles, **Then** multiple distinct classic sudoku puzzles are
   available for selection.
2. **Given** the list of example puzzles is open, **When** the user selects one,
   **Then** the board is replaced with that puzzle's given digits and any prior
   solving progress is cleared.
3. **Given** the user has selected an example puzzle, **When** they click "Solve
   All", **Then** that specific puzzle is solved correctly.

---

### User Story 3 - Enter a Custom Puzzle From Scratch (Priority: P3)

A user has their own sudoku puzzle (for example, from a newspaper) and wants to
type its given digits into an empty grid so the application can solve it for them.

**Why this priority**: Extends the tool's value beyond the bundled examples to any
real-world puzzle, but depends on the core solving capability already being in
place (P1) and is a secondary path for users who don't just want a random puzzle.

**Independent Test**: Start a blank grid, type in a known valid set of given
digits for a classic puzzle, and click "Solve All" to confirm it solves correctly.

**Acceptance Scenarios**:

1. **Given** the user wants to enter their own puzzle, **When** they choose to
   start from scratch, **Then** an empty 9x9 grid is presented for manual digit
   entry.
2. **Given** the user is entering digits into the empty grid, **When** they enter
   a digit that conflicts with classic sudoku rules (duplicate in the same row,
   column, or 3x3 box), **Then** the conflict is clearly flagged to the user.
3. **Given** the user has entered a complete and valid set of given digits with no
   rule conflicts, **When** they click "Solve All", **Then** the puzzle is solved
   correctly.
4. **Given** the user has entered given digits that make the puzzle unsolvable,
   **When** they click "Solve All", **Then** the application informs the user that
   no solution exists instead of failing silently or hanging.

---

### User Story 4 - Reveal the Solution One Digit at a Time (Priority: P2)

A user wants to understand how a puzzle is solved (or just wants a hint) rather
than seeing the whole solution at once, so they click "Solve Next Digit"
repeatedly to reveal the solution incrementally.

**Why this priority**: This is an explicitly requested, distinct interaction mode
from "Solve All" that adds significant learning/hint value, on par with choosing
an example puzzle.

**Independent Test**: With any valid puzzle loaded (default, example, or custom),
click "Solve Next Digit" once and confirm exactly one additional correct digit
appears; click it repeatedly and confirm the puzzle reaches a fully solved state
identical to using "Solve All".

**Acceptance Scenarios**:

1. **Given** a valid puzzle is loaded with empty cells remaining, **When** the user
   clicks "Solve Next Digit", **Then** exactly one previously empty cell is filled
   with its correct digit and all other cells remain unchanged.
2. **Given** the user repeatedly clicks "Solve Next Digit" until no empty cells
   remain, **When** the last empty cell is filled, **Then** the puzzle matches the
   result that "Solve All" would have produced.
3. **Given** the puzzle is already fully solved, **When** the user clicks "Solve
   Next Digit" again, **Then** the application takes no destructive action and
   indicates the puzzle is already complete.

---

### User Story 5 - See Which Cell Is About to Be Changed (Priority: P2)

A user clicks (or navigates via keyboard to) a cell on the board. That cell is
immediately marked so the user can see, at a glance, exactly which cell they
are about to enter or change a value for.

**Why this priority**: Without a visible marker, users must guess which cell
is currently active before typing a digit, which is confusing and error-prone
during manual entry (User Story 3). It is a focused usability refinement to
the existing board interaction rather than new solving capability, so it
ranks alongside the other P2 stories.

**Independent Test**: Click any cell on the board and confirm it is visually
marked as selected; click a different cell and confirm the marking moves to
the newly clicked cell and no longer appears on the previous one.

**Acceptance Scenarios**:

1. **Given** a puzzle is displayed on the board, **When** the user clicks a
   cell, **Then** that cell is visually marked as selected.
2. **Given** a cell is currently marked as selected, **When** the user clicks
   a different cell, **Then** the marking moves to the newly clicked cell and
   the previously selected cell no longer shows the marking.
3. **Given** a cell is currently marked as selected, **When** the user types a
   digit, **Then** the digit is entered into the selected cell.
4. **Given** a cell is marked as selected, **When** the user moves the
   selection using keyboard navigation (arrow keys), **Then** the marking
   moves to the newly focused cell and the previous cell no longer shows the
   marking.
5. **Given** the user clicks a cell containing an original given digit,
   **When** the cell becomes selected, **Then** it is still visually marked as
   selected, even though its value cannot be changed.

---

### Edge Cases

- What happens when the user tries to solve a puzzle that has rule conflicts
  (duplicate digits) in its given digits? The application MUST flag the conflict
  and prevent solving until it is resolved.
- What happens when a custom or selected puzzle has no valid solution? The
  application MUST inform the user rather than freezing or crashing.
- What happens when the user clicks "Solve All" or "Solve Next Digit" on an empty
  grid (no given digits at all)? The application MUST handle this gracefully,
  either by requesting at least one given digit or by resolving to a valid
  complete grid if a blank board is considered a valid input.
- What happens when the user switches to entering a custom puzzle while an example
  puzzle is partially solved? The application MUST clearly reset to a blank board
  without mixing digits from the previous puzzle.
- What happens when the user picks the same example puzzle that is already
  displayed? The application MUST reset that puzzle to its original given digits.
- What happens when the user loads a different puzzle (selects a new example,
  starts a custom puzzle, or resets) while a cell is selected? The application
  MUST clear the previous selection so no cell from the prior puzzle state
  appears selected on the new board.
- What happens when the solver fills a cell (via "Solve All" or "Solve Next
  Digit") that is currently selected? The selection MUST remain visible on
  that cell after it is filled, rather than being cleared as a side effect of
  solving.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a randomly selected puzzle from a bundled,
  offline-available set of classic sudoku example puzzles automatically when the
  application is first loaded, with no user action required and no live network
  call.
- **FR-002**: System MUST provide a way for users to browse and select any puzzle
  from the bundled set of example puzzles, replacing the current board with the
  selected puzzle's given digits.
- **FR-003**: System MUST allow users to start from a blank 9x9 grid and manually
  enter their own given digits to define a custom puzzle.
- **FR-004**: System MUST validate any puzzle (example or custom) for classic
  sudoku rule conflicts (duplicate digit within the same row, column, or 3x3 box)
  in real time as each digit is entered, clearly and immediately highlighting any
  conflict, before the user attempts to solve.
- **FR-005**: System MUST provide a "Solve All" action that, for a valid puzzle,
  fills every remaining empty cell with the digit required to complete a correct
  classic sudoku solution; if the puzzle admits more than one valid solution
  (possible for user-entered puzzles), the system MUST show any one valid
  solution without needing to flag that alternatives exist.
- **FR-006**: System MUST provide a "Solve Next Digit" action that, for a valid
  puzzle with at least one empty cell, fills in exactly one additional correct
  digit (consistent with the single solution chosen for that puzzle) and leaves
  all other cells unchanged.
- **FR-007**: System MUST detect when a puzzle (example or custom) has no valid
  solution and inform the user, instead of hanging, crashing, or filling in
  incorrect digits.
- **FR-008**: System MUST NOT require user registration, login, sign-in, or any
  personal identification for any feature, including solving and example
  selection.
- **FR-009**: System MUST allow the user to reset the currently displayed puzzle
  back to its original given digits, discarding any digits filled in by solving.
- **FR-010**: System MUST visually distinguish original given digits from digits
  that were filled in by the solver, so users can tell what was provided versus
  solved.
- **FR-011**: System MUST prevent "Solve All" and "Solve Next Digit" from being
  applied to a puzzle currently flagged with rule conflicts, until the conflict is
  resolved.
- **FR-012**: System MUST offer at least 5 distinct example puzzles covering a
  range of difficulty levels for selection.
- **FR-013**: System MUST allow the user to select exactly one cell on the
  board at a time (by clicking it or moving keyboard focus to it) and MUST
  visually mark that cell as selected — clearly distinguishable from
  unselected cells and from the given/user-entered/solver-filled markings
  (FR-010) — so the user can see which cell they are about to change. The
  marking MUST move entirely to a newly selected cell (never showing on more
  than one cell at once) and MUST be cleared whenever the displayed puzzle
  changes (new example, custom puzzle, or reset).

### Key Entities

- **Puzzle**: Represents one classic 9x9 sudoku grid in play. Attributes include
  its 81 cell values, which cells are "given" versus empty versus solved, its
  source (bundled example vs. user-entered), and whether it currently has rule
  conflicts or is fully solved.
- **Example Puzzle**: A single curated classic sudoku puzzle available for
  selection, including its given digits and a descriptive difficulty label, drawn
  from a bundled collection referenced from publicly available sudoku puzzle
  sources.
- **Cell**: A single position on the puzzle grid, identified by its row, column,
  and containing 3x3 box, holding either no digit or a digit 1-9, along with a
  marker of whether it is a given digit, a user-entered digit, or a solver-filled
  digit. It also carries a "selected" state, marking the single cell (if any)
  the user is about to change or enter a value into (FR-013).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor is shown a ready-to-solve puzzle within 1
  second of the page finishing loading, with zero setup steps.
- **SC-002**: Users can go from a valid, unsolved puzzle to a fully and correctly
  solved puzzle using a single "Solve All" action, completing in under 2 seconds.
- **SC-003**: Each use of "Solve Next Digit" reveals exactly one new correct digit
  and completes in under 1 second, for at least 50 consecutive uses on a single
  puzzle without error.
- **SC-004**: 100% of puzzles containing rule conflicts (example or custom) are
  flagged to the user before any solve action changes the board.
- **SC-005**: Users can load, view, select, enter, and solve puzzles with 0
  authentication steps (no account, login, or credential is ever requested).
- **SC-006**: At least 5 distinct example puzzles spanning multiple difficulty
  levels are available for users to choose from at any time.
- **SC-007**: 100% of unsolvable puzzles (example or custom) result in a clear
  message to the user rather than an unresponsive page or crash.
- **SC-008**: Users can identify which single cell will receive their next
  typed digit within 1 second of clicking or navigating to it, with never more
  than one cell shown as selected at a time.

## Assumptions

- The example puzzles are researched from publicly available classic sudoku
  puzzle collections and bundled with the application ahead of time (confirmed
  via clarification), so that solving and example selection work fully offline
  without a live internet call at runtime, consistent with the project's
  browser-native, client-side approach.
- "Classic sudoku" means the standard 9x9 grid divided into nine 3x3 boxes, using
  digits 1-9, where each bundled example puzzle has exactly one valid solution;
  user-entered puzzles are not required to have a unique solution, and the
  system shows any one valid solution if more than one exists (confirmed via
  clarification).
- Difficulty labels on example puzzles (e.g., easy/medium/hard) are descriptive
  only and do not change how solving works.
- No user accounts, saved solving history, or persistence across browser sessions
  are required, since login and identification are explicitly out of scope.
- "Solve Next Digit" reveals digits in whichever order the solving logic
  determines next (for example, the most constrained/certain cell); no specific
  reveal order is required by the user beyond "one correct digit at a time".
- Only cells without a "given" digit can be edited by the user or filled by the
  solver; given digits of a loaded example puzzle are fixed unless the user
  switches to entering a custom puzzle from scratch.
- The cell selection marking (FR-013) is a purely visual/interaction-state
  concern with no persistence requirement — it does not need to be remembered
  across page reloads or puzzle changes, and only one cell can be selected at
  a time (no multi-cell selection).
