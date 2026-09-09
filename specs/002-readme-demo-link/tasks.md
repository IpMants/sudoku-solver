---

description: "Task list template for feature implementation"
---

# Tasks: README Demo Link

**Input**: Design documents from `/specs/002-readme-demo-link/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: Not requested for this feature — it is a documentation-only change with no automated test framework applicable (see plan.md Technical Context).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- Single file at repository root: `README.md`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the current state of the file this feature touches before editing it

- [X] T001 Read the current `README.md` at repository root and identify the exact location of the top-level title/heading, to determine where the new demo link will be inserted

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: N/A — this feature has no shared infrastructure, data model, or cross-story blocking work; it is a single-file documentation edit with one user story. This phase is intentionally empty and both Setup and the single user story below can proceed directly.

---

## Phase 3: User Story 1 - Discover and open the live demo from the README (Priority: P1) 🎯 MVP

**Goal**: A visitor viewing the rendered `README.md` finds a clearly labeled "Live Demo" link near the top of the document that opens the deployed Sudoku Solver application at `https://ipmants.github.io/sudoku-solver/`.

**Independent Test**: Open the rendered README (GitHub or local Markdown preview), confirm the demo link is visible near the top within ~5 seconds, click it, and confirm the live Sudoku Solver app loads at `https://ipmants.github.io/sudoku-solver/`.

### Implementation for User Story 1

- [X] T002 [US1] Add a "🚀 Live Demo" Markdown link immediately below the top-level title/heading in `README.md`, pointing to `https://ipmants.github.io/sudoku-solver/` per the format decided in research.md (`[🚀 Live Demo](https://ipmants.github.io/sudoku-solver/)`), satisfying FR-001, FR-002, FR-003, and FR-004
- [X] T003 [US1] Verify the raw Markdown source of `README.md` still shows the full URL as visible plain text within the link syntax (not hidden behind a bare word or badge-only reference), satisfying the plain-text-viewer edge case in spec.md

**Checkpoint**: At this point, User Story 1 is fully functional and independently testable — the README has a working, visible, correctly-targeted demo link.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation of the change

- [X] T004 Run the manual validation steps in `specs/002-readme-demo-link/quickstart.md` end-to-end (view rendered README, locate link, click through to the live demo, check plain-text fallback) and confirm all four steps pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Empty/not applicable for this feature
- **User Story 1 (Phase 3)**: Depends on Phase 1 (T001) completing so the insertion point is known
- **Polish (Phase 4)**: Depends on User Story 1 (Phase 3) being complete

### User Story Dependencies

- **User Story 1 (P1)**: The only user story in this feature; no dependencies on other stories.

### Within User Story 1

- T002 (add the link) before T003 (verify plain-text fallback of what was just added)

### Parallel Opportunities

- None significant — this is a single small file with two sequential edits/checks (T002 → T003) plus one prerequisite read (T001) and one final validation (T004). All tasks touch or depend on the same file/document, so no `[P]` markers apply.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 — locate insertion point)
2. Skip Phase 2: Foundational (not applicable)
3. Complete Phase 3: User Story 1 (T002–T003 — add and verify the link)
4. **STOP and VALIDATE**: Run Phase 4 (T004 — quickstart validation)
5. Commit and push `README.md`

### Incremental Delivery

Not applicable beyond the single MVP story — this feature has only one user story (P1), so completing it delivers the entire feature.

---

## Notes

- [P] tasks = different files, no dependencies — none apply here since every task touches `README.md` or validates it
- [Story] label maps task to specific user story for traceability
- Commit after T002/T003 as one logical change to `README.md`
- Avoid: adding unrelated README content, changing the deployment workflow, or introducing badge-only links that hide the underlying URL
