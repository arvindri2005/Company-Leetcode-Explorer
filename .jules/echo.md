# Echo's Journal

## Critical Discoveries

### [2024-05-22] Missing "Skip to Content" Link
- **Discovery**: The application lacked a mechanism for keyboard users to bypass the main navigation and jump directly to the primary content area.
- **Impact**: Keyboard users were forced to tab through all navigation links on every page load to access the main content, creating significant friction and fatigue.
- **Fix**: Implemented a "Skip to Content" link as the first focusable element in the `<body>`.
- **Implementation**:
  - Added an anchor tag pointing to `#main-content`.
  - Used `sr-only` class to hide it visually by default.
  - Used `focus:not-sr-only` and positioning utilities to make it visible when focused.
  - Added `id="main-content"` and `tabIndex={-1}` to the `<main>` element to ensure focus is correctly managed.

### [2025-05-27] Missing Close Button in DialogContent
- **Discovery**: The `DialogContent` component in `src/components/ui/dialog.tsx` lacked a built-in visual Close button, unlike `SheetContent`.
- **Impact**: Users relying on visual cues (mouse users who don't know Escape closes modals) or those requiring explicit controls might find it difficult to dismiss the dialog.
- **Fix**: Added a `DialogPrimitive.Close` button inside `DialogContent`.
- **Implementation**:
  - Inserted `<DialogPrimitive.Close>` with `X` icon from `lucide-react`.
  - Added `sr-only` text "Close" for screen readers.
  - Styled consistently with other accessible close buttons (hover states, focus rings).
