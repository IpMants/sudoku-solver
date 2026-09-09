# Implementation Plan: README Demo Link

**Branch**: `002-readme-demo-link` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-readme-demo-link/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a clearly labeled "Live Demo" link near the top of `README.md` pointing to the
already-deployed GitHub Pages instance (`https://ipmants.github.io/sudoku-solver/`).
This is a documentation-only change: no application code, build configuration, or
deployment workflow is modified — the demo is already live via the existing
GitHub Actions Pages workflow.

## Technical Context

**Language/Version**: Markdown (README.md); no code changes

**Primary Dependencies**: N/A — no new dependencies

**Storage**: N/A

**Testing**: Manual verification (click the link in the rendered README, confirm the
live app loads); no automated tests apply to a static documentation link

**Target Platform**: GitHub-rendered Markdown (repository README) viewed in any browser

**Project Type**: Documentation update within an existing single-project web app repo

**Performance Goals**: N/A (not applicable to a documentation link)

**Constraints**: The link text must remain accurate if the deployed URL ever changes;
no other constraints

**Scale/Scope**: Single-line addition/edit to one file (`README.md`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This feature only edits `README.md` documentation; it introduces no application code,
solver logic, UI, or dependencies. Evaluating each constitution principle:

| Principle | Applies? | Assessment |
|-----------|----------|------------|
| I. Full Documentation | N/A | No code is added/changed; the README itself *is* documentation, and this change improves it (adds discoverability of the live demo). |
| II. Browser-Native Client-Side Application | N/A | No architecture change; the linked demo is the existing static browser app. |
| III. Test-First Solver Correctness | N/A | No solver/validation logic touched. |
| IV. Responsive Performance | N/A | No runtime code touched. |
| V. Accessible, Usable Interface | Applies (lightly) | The added README link must use standard Markdown link syntax so it renders as an accessible, readable link (visible URL as fallback per spec edge case). |

**Result**: PASS. No violations, no complexity to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-readme-demo-link/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command) — N/A, no entities
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command) — N/A, no interfaces
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
README.md   # Single file touched by this feature: add a "Live Demo" link near the top
```

**Structure Decision**: No source code structure changes. This feature edits a single
existing file, `README.md`, at the repository root. No `data-model.md` content or
`contracts/` directory is generated (see Phase 1 notes) because the feature has no
data entities or external interfaces.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — this section is not applicable.
