# Quickstart: Validate the README Demo Link

This guide validates that the feature described in [spec.md](./spec.md) works
end-to-end. No build, install, or test framework is required — this is a
documentation-only change.

## Prerequisites

- The change to `README.md` has been made (see [plan.md](./plan.md) for the
  design decisions on placement/format).
- The GitHub Pages demo deployment is live at
  `https://ipmants.github.io/sudoku-solver/` (already provided by the existing
  `.github/workflows/deploy.yml` CI/CD workflow — no action needed here).

## Validation Steps

1. **View the rendered README**
   - On GitHub: open the repository's main page (README renders automatically).
   - Locally: open `README.md` in a Markdown preview (e.g., VS Code's built-in
     preview, `Ctrl+Shift+V`).

2. **Locate the demo link**
   - Confirm a clearly labeled link (e.g., "Live Demo") appears near the top of
     the document, immediately visible without scrolling past the title/intro.
   - *Expected*: Matches FR-002 / SC-001 — link found within ~5 seconds of
     opening the document.

3. **Follow the link**
   - Click the link (GitHub-rendered view) or copy the URL from the raw
     Markdown source into a browser.
   - *Expected*: The browser opens `https://ipmants.github.io/sudoku-solver/`
     and the Sudoku Solver application loads and is interactive (matches FR-001,
     FR-004, SC-002).

4. **Check plain-text fallback**
   - View the raw `README.md` source (e.g., `cat README.md` or GitHub's "Raw"
     view).
   - *Expected*: The full URL `https://ipmants.github.io/sudoku-solver/` is
     visible as plain text within the Markdown link syntax, satisfying the
     edge case for readers using tools that don't render Markdown links.

## Expected Outcome

All four steps succeed: the link is immediately visible, correctly labeled,
points to the exact deployed URL, and the URL is readable even without
Markdown rendering. This confirms the feature meets all functional
requirements (FR-001–FR-004) and success criteria (SC-001–SC-003) in
[spec.md](./spec.md).
