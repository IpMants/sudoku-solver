# Feature Specification: README Demo Link

**Feature Branch**: `002-readme-demo-link`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "Readme should have a link to the demo application which is deployed to: https://ipmants.github.io/sudoku-solver/"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and open the live demo from the README (Priority: P1)

A visitor lands on the project's README (e.g., via the GitHub repository page) and wants to try the application immediately without cloning the repository or setting up a local development environment. They look for a link to a running instance of the app.

**Why this priority**: This is the entire scope of the feature — without a working, easy-to-find link, the feature delivers no value. It is also the only user story needed to consider the feature complete.

**Independent Test**: Open the README (rendered on GitHub or in a local Markdown viewer), locate the demo link near the top of the document, click/open it, and confirm it loads the deployed Sudoku Solver application in a browser.

**Acceptance Scenarios**:

1. **Given** a visitor is viewing the rendered README, **When** they look at the top of the document, **Then** they find a clearly labeled link to the live demo application.
2. **Given** a visitor clicks the demo link, **When** the linked page loads, **Then** the deployed Sudoku Solver application opens successfully at `https://ipmants.github.io/sudoku-solver/`.
3. **Given** the demo application URL changes in the future, **When** the README is updated, **Then** only the single link destination needs to change (no other document restructuring required).

### Edge Cases

- What happens when the deployed demo is temporarily unavailable (e.g., GitHub Pages outage or a broken deployment)? The README link itself remains correct; availability of the target page is outside this feature's control and is covered by the separate deployment/CI workflow.
- How does the document handle a reader using a plain-text Markdown viewer that does not render links as clickable? The link's destination URL MUST still be visibly readable as plain text next to or within the link label.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The README MUST include a link to the deployed demo application at `https://ipmants.github.io/sudoku-solver/`.
- **FR-002**: The demo link MUST be placed near the top of the README (e.g., directly under the project title/introduction) so it is immediately visible to a visitor.
- **FR-003**: The demo link MUST use a clear, descriptive label (e.g., "Live Demo" or "Try it online") that communicates it opens a working instance of the application, not documentation or source code.
- **FR-004**: The link's underlying URL MUST exactly match the deployed demo address: `https://ipmants.github.io/sudoku-solver/`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor reading the README can locate the demo link within 5 seconds of opening the document.
- **SC-002**: Clicking the demo link successfully opens the live, working Sudoku Solver application 100% of the time (assuming the deployment itself is up).
- **SC-003**: The README requires a single-line edit to update the demo link if the deployment URL ever changes.

## Assumptions

- The application is already deployed and reachable at `https://ipmants.github.io/sudoku-solver/` (confirmed by the existing GitHub Pages deployment workflow); this feature only documents/links to it and does not change the deployment itself.
- "README" refers to the repository's root `README.md` file, the primary entry point most visitors read first.
- No additional demo instances (e.g., staging, per-branch previews) are in scope; only the single production demo URL is linked.
