## 2024-12-23 - Chip Accessibility
**Learning:** Toggle buttons (like filter chips) must use `aria-pressed` to communicate state to screen readers, not just visual color changes.
**Action:** Ensure all interactive toggle elements map their selected state to `aria-pressed`.

## 2024-12-24 - Dynamic ARIA Labels
**Learning:** Icon-only buttons with changing states (e.g., Bookmark/Unbookmark, Expand/Collapse) need dynamic `aria-label`s to accurately reflect the action that will occur, not just the current state.
**Action:** Use ternary operators in `aria-label` to describe the *next* action (e.g., `isBookmarked ? "Remove bookmark" : "Add bookmark"`) and pair with `aria-expanded` for collapsible sections.
