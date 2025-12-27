# Echo's Journal 🔊

## Critical Discoveries

### Unique UI Patterns
- **Hybrid Interaction Pattern in `ProblemCard`**: Uses an outer `div` with `onClick` for mouse users (convenience) but delegates keyboard focus/action to specific internal buttons (like the expand chevron). This prevents invalid HTML (nested interactive elements) but requires careful testing to ensure keyboard users have equivalent access to all functionality.

### Keyboard Traps
- **Company Search Bar Suggestions**: The autocomplete dropdown in `CompanySearchBar` (`src/components/company/company-search-bar.tsx`) displays suggestions but does not allow keyboard users to navigate them with Arrow keys. They can only continue typing or press Enter to submit the search term, effectively making the suggestions inaccessible to keyboard-only users.
