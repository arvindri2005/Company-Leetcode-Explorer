# Echo's Journal

## Critical Discoveries

### Unique UI Patterns
-   **Decorative Icons in Action Cards:** The `ActionFeatureCard` component used decorative icons without `aria-hidden="true"`. This caused screen readers to potentially announce them redundantly or as "image", creating noise for users. We fixed this by adding `aria-hidden="true"` to the icon wrapper.
-   **Semantic Headings in Cards:** The `CardTitle` component was defaulting to a `div`, stripping semantic meaning from card titles. This forced screen reader users to navigate without the benefit of heading hierarchy. We upgraded `CardTitle` to default to `h3`, improving navigation structure across the application.

### Lessons Learned
-   **Base UI Components are High Leverage:** Fixing `CardTitle` in the base UI library (`src/components/ui/card.tsx`) instantly improved semantics for all cards in the application. Always check the base primitives first.
-   **Playwright for Attribute Verification:** Even without a full running app, Playwright can be used with synthesized HTML to verify that specific DOM attributes (like `aria-hidden`) are correctly rendered by React components.
