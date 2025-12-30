# Echo's Journal 🔊

## Critical Discoveries

### Unique UI Patterns
- **Full-Card Clickability via CSS Overlay**: `CompanyCard` and `TechCompanyCard` use a `Link` with `after:absolute after:inset-0 after:z-10` to make the entire card clickable. This is a valid accessible pattern as long as the card contains no other interactive elements. It avoids invalid HTML nesting (`<a>` inside `<a>` or `<button>`).
  - *Verification*: The focus ring correctly highlights the "View Problems" button (or "View" link), which is the semantic anchor.

### Components that are "Keyboard Traps" or Barriers
- **ToastClose Missing Label**: The `ToastClose` component in `src/components/ui/toast.tsx` used an icon-only button without screen-reader text. This makes it impossible for blind users to know what the button does.
  - *Fix*: Added `<span className="sr-only">Close</span>`.

### Potential Improvements (Backlog)
- **Filter Groups**: `ProblemListControls` uses a list of `Chip` buttons. These should be wrapped in a container with `role="group"` and `aria-label` to provide context (e.g., "Filter by difficulty").
- **AutoFocus**: The `LoginForm` and `SignupForm` use `autoFocus` on the first input. While convenient for sighted users, this can be disorienting for screen reader users who might miss the page context (Header, Title) as focus jumps immediately to the input.
- **Search Roles**: `CompanySearchBar` uses `role="combobox"` but could be further enhanced with better `aria-activedescendant` management for the dropdown options.

## Lessons Learned
- **CSS-only Overlays**: Using CSS pseudo-elements to expand click targets is a robust way to handle "clickable cards" without breaking semantic HTML rules.
