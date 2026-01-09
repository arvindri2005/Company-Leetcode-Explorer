# Echo's Journal 🔊

## Discovery: Hidden Content in Pagination
**Date:** [Current Date]
**Component:** `src/components/ui/pagination.tsx`
**Issue:** The `PaginationEllipsis` component applies `aria-hidden` to its root container.
**Impact:** This hides the inner `<span className="sr-only">More pages</span>` from screen readers, causing them to skip the ellipsis entirely. Users relying on screen readers may not realize there are skipped pages in the pagination sequence.
**Fix:** Remove `aria-hidden` from the container and apply `aria-hidden="true"` only to the decorative icon.

## Discovery: Unhidden Decorative Icons
**Date:** [Current Date]
**Components:** `Sheet`, `Toast`, `Accordion`, `Checkbox`, `Pagination`
**Issue:** Many UI components use SVG icons (like `X`, `ChevronDown`) alongside text or as standalone buttons with `sr-only` labels, but fail to explicitly hide the SVG from assistive technology using `aria-hidden="true"`.
**Impact:** While often ignored, these icons can sometimes cause "noisy" announcements (e.g., "image", "graphic") or redundant focus targets depending on the screen reader / browser combination.
**Fix:** Systematically add `aria-hidden="true"` to all purely decorative icons in `src/components/ui`.
