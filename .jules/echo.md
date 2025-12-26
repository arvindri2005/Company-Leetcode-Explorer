# Echo's Journal 🔊

## Critical Discoveries

### Hybrid Interaction Pattern in Cards
Complex interactive cards (e.g., `ProblemCard`) use a hybrid interaction pattern:
- The outer container (`div`) handles `onClick` for mouse users but lacks a button role to avoid invalid nesting of interactive elements.
- Keyboard accessibility and focus management are delegated to specific child buttons (e.g., an expand chevron).
- **Lesson:** This avoids "nested interactive controls" (invalid HTML) but requires ensuring all mouse-available actions are also available via keyboard-focusable children.

### Button Loading State
The `Button` component suppresses children content when `isLoading` is true and `size="icon"`.
- **Issue:** If the button relies on the icon for meaning and lacks an `aria-label`, it becomes nameless during loading.
- **Fix:** Added `aria-busy="true"` and a fallback screen-reader-only "Loading" text if `aria-label` is missing.
- **Lesson:** Always ensure accessible names persist during state changes.

### Typing Test Accessibility
The typing test (`TypingArea`) uses a transparent textarea over a visual code display.
- **Issue:** The textarea lacks a label, and the visual code is `aria-hidden` (or not associated). Screen reader users might hear what they type but not what they *should* type.
- **Future Opportunity:** Associate the code display with the textarea using `aria-describedby` or providing a hidden instruction block.
