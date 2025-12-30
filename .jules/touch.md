## 2024-05-24 - [Mobile First Targets] **Friction:** [Buttons smaller than 44px on mobile] **Smoothness:** [Responsive Height Utilities]

Consistent finding across the app: 40px buttons (`h-10`) are too small for reliable touch interaction on mobile devices, causing user frustration and missed taps.

**Smoothness Applied:**
- Use responsive sizing for interactive elements: `h-11 md:h-10`.
- Ensures 44px touch target on mobile while maintaining compact 40px desktop design.
- Applied to Button `default` and `icon` variants.

**Touch Rule:**
Always verify tappable areas are at least 44x44px on viewport widths < 768px.

## 2024-05-24 - [Micro-Target Expansion] **Friction:** [16px inputs are untappable] **Smoothness:** [Pseudo-element Hit Areas]

Found that Checkbox and RadioGroupItem were native 16px (`h-4 w-4`) elements, making them nearly impossible to tap accurately without a label.

**Smoothness Applied:**
- Added `relative` and `after:absolute after:inset-[-14px] after:content-['']` to the primitive roots.
- Creates a 44x44px invisible touch target centered on the 16px visual element.
- Does not affect layout or visual design, but catches "fat finger" taps effectively.

**Touch Rule:**
For elements that *must* be small visually (like checkboxes), use pseudo-elements to expand the interactive hit area to at least 44px.
