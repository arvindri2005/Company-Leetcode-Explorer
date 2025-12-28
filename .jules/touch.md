## 2024-05-24 - [Mobile First Targets] **Friction:** [Buttons smaller than 44px on mobile] **Smoothness:** [Responsive Height Utilities]

Consistent finding across the app: 40px buttons (`h-10`) are too small for reliable touch interaction on mobile devices, causing user frustration and missed taps.

**Smoothness Applied:**
- Use responsive sizing for interactive elements: `h-11 md:h-10`.
- Ensures 44px touch target on mobile while maintaining compact 40px desktop design.
- Applied to Button `default` and `icon` variants.

**Touch Rule:**
Always verify tappable areas are at least 44x44px on viewport widths < 768px.

## 2025-12-27 - [Pagination Touch Targets] **Friction:** [Small Pagination Buttons] **Smoothness:** [Responsive Pagination Sizing]

**Friction:** The pagination controls were using `h-9` (36px) fixed size, which is below the recommended 44px touch target size for mobile devices. Additionally, on very narrow screens (320px), the controls could cause horizontal scrolling or layout breakage.

**Smoothness Applied:**
- Updated `PaginationControls` to use `h-11` (44px) and `w-11` on mobile, scaling down to `md:h-9` (36px) on desktop.
- Added `flex-wrap` to the container to handle narrow screens gracefully.
- Verified with Playwright screenshot on 320px viewport.

**Touch Rule:**
Pagination controls must be at least 44x44px on touch devices and wrap gracefully on small screens.
