## 2024-12-23 - Chip Accessibility
**Learning:** Toggle buttons (like filter chips) must use `aria-pressed` to communicate state to screen readers, not just visual color changes.
**Action:** Ensure all interactive toggle elements map their selected state to `aria-pressed`.

## 2024-12-24 - Dynamic ARIA Labels
**Learning:** Icon-only buttons with changing states (e.g., Bookmark/Unbookmark, Expand/Collapse) need dynamic `aria-label`s to accurately reflect the action that will occur, not just the current state.
**Action:** Use ternary operators in `aria-label` to describe the *next* action (e.g., `isBookmarked ? "Remove bookmark" : "Add bookmark"`) and pair with `aria-expanded` for collapsible sections.

## 2024-12-25 - Native Loading States
**Learning:** Adding a native `isLoading` prop to the core `Button` component significantly reduces boilerplate across the application. It ensures consistent loading indicators (spinners), automatically handles `disabled` state, and manages layout shifts for icon-only buttons versus text buttons. This is preferred over manual `isLoading ? <Loader /> : <Icon />` toggling in consumer components.
**Action:** When creating interactive UI elements, build state handling (loading, disabled) directly into the component props to enforce consistency and reduce consumer complexity.

## 2025-05-18 - Full Card Clickability
**Learning:** Making entire cards clickable by nesting an `<a>` tag inside a `<div>` is invalid HTML. The preferred UX pattern is to keep the interactive element (the link/button) distinct but expand its hit area using a CSS overlay (`after:absolute after:inset-0`) on a relative parent container. This maintains semantic validity and allows for nested interactive elements (like bookmark buttons) to sit above the overlay (`z-20`).
**Action:** Use the "Pseudo-element Overlay" pattern for clickable cards instead of wrapping the whole card in a Link.

## 2025-05-19 - Input Action Density
**Learning:** When stacking multiple action buttons (like Search + Clear) inside an input field, static padding is insufficient.
**Action:** Implement dynamic padding classes (e.g., `pr-28` vs `pr-17`) conditioned on the visibility of secondary actions to prevent text from flowing under buttons while maximizing space when actions are hidden.
