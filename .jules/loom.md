# Loom's Journal 🧶

This journal tracks structural code improvements and technical debt discoveries.

## Critical Discoveries

### Technical Debt
- `src/types/index.ts` is a "God Object" file (>500 lines) mixing domain models, UI state, API DTOs, and Zod schemas. This makes refactoring difficult and increases merge conflicts. It should be decomposed into `src/types/{domain|ui|api}.ts`.
- `FeatureCard` naming collision: There was a local `FeatureCard` in `home-features-grid.tsx` and an exported `FeatureCard` in `src/components/ui/feature-card.tsx` with different props and purposes. This was resolved by extracting the local one to `ActionFeatureCard`.

### Patterns Not Adopted
- **Strict Nominal Typing:** The codebase uses structural typing heavily. Introducing branded types for IDs (e.g. `CompanyId`) was considered but deemed too invasive for a "small improvement".

## Refactor Log

| Date | Component | Change | Why |
|------|-----------|--------|-----|
| [Current Date] | `FeatureCard` | Extracted `ActionFeatureCard` & Stronger Types | Removed `any` from props, resolved component name ambiguity, improved reusability. |
