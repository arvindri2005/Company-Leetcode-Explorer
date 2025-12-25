## 2024-05-24 - [Mobile First Targets] **Friction:** [Buttons smaller than 44px on mobile] **Smoothness:** [Responsive Height Utilities]

Consistent finding across the app: 40px buttons (`h-10`) are too small for reliable touch interaction on mobile devices, causing user frustration and missed taps.

**Smoothness Applied:**
- Use responsive sizing for interactive elements: `h-11 md:h-10`.
- Ensures 44px touch target on mobile while maintaining compact 40px desktop design.
- Applied to Button `default` and `icon` variants.

**Touch Rule:**
Always verify tappable areas are at least 44x44px on viewport widths < 768px.
