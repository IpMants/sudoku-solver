# Phase 0 Research: README Demo Link

## Overview

This feature has no unresolved `NEEDS CLARIFICATION` items from the Technical Context
in `plan.md`. It is a documentation-only change with a single, unambiguous deployed
URL already provided by the user and already confirmed live (via the existing GitHub
Pages deployment workflow set up for this repository). Research below covers the
small conventions worth confirming before editing `README.md`.

## Decision: Link placement

- **Decision**: Place the demo link directly under the top-level project title/heading
  in `README.md`, before any other descriptive text.
- **Rationale**: Matches FR-002 and SC-001 (discoverable within 5 seconds). Placing it
  above the fold is the standard convention for open-source project READMEs that have
  a live demo (seen across most popular GitHub projects with hosted demos).
- **Alternatives considered**:
  - Placing it in a dedicated "Demo" section further down — rejected, because it
    reduces immediate visibility and doesn't clearly satisfy "near the top" (FR-002).
  - Placing it only in a badge/shield — rejected as the sole approach because badges
    can be visually ambiguous about their destination; a plain descriptive link is
    clearer and satisfies the plain-text-URL edge case in the spec.

## Decision: Link format

- **Decision**: Use standard Markdown link syntax with a descriptive label and the
  full URL visible as the link target, e.g.
  `[🚀 Live Demo](https://ipmants.github.io/sudoku-solver/)`.
- **Rationale**: Renders as a clickable link on GitHub while the destination URL is
  still inspectable (hover/status bar, or visible in raw Markdown source), satisfying
  the plain-text-viewer edge case identified in the spec.
- **Alternatives considered**: HTML `<a>` tag — rejected, unnecessary since GitHub
  Flavored Markdown fully supports Markdown links; using raw HTML would be an
  inconsistent style choice for a Markdown file with no other HTML.

## Decision: Verification approach

- **Decision**: Manually verify by viewing the rendered `README.md` on GitHub (or a
  local Markdown preview) and clicking the link to confirm it opens the live app.
- **Rationale**: This is a static content change; no automated test framework in this
  repository targets Markdown/documentation content, and adding one would be
  disproportionate to the scope of a single link.
- **Alternatives considered**: Automated link-checking CI step — noted as a possible
  future enhancement but out of scope for this feature (not requested, and the spec's
  success criteria are satisfied by manual verification).

## Output

All Technical Context fields in `plan.md` are resolved; no outstanding
`NEEDS CLARIFICATION` markers remain.
