# Prism Journal 🌈

## Critical Discoveries

### Visual Drift in OG Image Generation
**Date:** [Current Date]
**Location:** `src/app/opengraph-image.tsx`
**Issue:** The OpenGraph image generation script contains numerous hardcoded hex values. While some match the `src/constants/colors.ts` definitions, others drift towards standard Tailwind colors (e.g., using `teal-400` `#2dd4bf` instead of Brand Teal `#00d4aa`).
**Impact:** Inconsistent branding on social shares compared to the main application UI.
**Action:** Standardizing `opengraph-image.tsx` to use `COLORS` from `src/constants/colors.ts` and updating `COLORS` to include necessary gradient stops (`tealDark`).

### Tailwind Config Duplication
**Date:** [Current Date]
**Location:** `tailwind.config.js` vs `src/constants/colors.ts`
**Issue:** `tailwind.config.js` re-defines the `COLORS` object inline instead of importing it from `src/constants/colors.ts`. This creates a risk of the config falling out of sync with the application constants.
**Action:** Manual sync performed during OG image refactor. Future recommendation: Make `colors.ts` a CommonJS module or use a build step to share tokens.
