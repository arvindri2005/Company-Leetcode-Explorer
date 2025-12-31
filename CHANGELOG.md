# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Polished Profile page UI with improved `UserInfoCard` styling and empty states for problem lists (3c49a4f).
- Expanded touch targets for `Checkbox` and `RadioGroup` components to improve mobile accessibility (1b23b69).
- Documented Event-Driven Architecture and Observer patterns in `guide/advanced-patterns.md` (4f5ce36).
- `inputMode` attributes to form fields for optimized mobile keyboards (ad88787).
- Caching for global user problem stats in `UserService` (4ebf1b6).
- User Activity Event System for tracking actions (3d9e6b4).
- Soft delete support for User Bookmarks (3976dbc).
- Twitter card metadata to company pages for better sharing (3f8e312).
- Unit tests for User Server Actions (85e3e3d).
- Job Application Tracker MVP and RFC (2684409).
- GitHub Actions CI workflow (af0d7f5).
- Native `isLoading` prop to `Button` component (8aada6b).
- Visual `OfflineIndicator` and `useOnlineStatus` hook (c9ca076).
- `autoComplete` attributes to authentication forms for improved password manager support (4e4e4f7).
- Staggered entrance animation to `ProblemList` (8b475ef).
- Dynamic Open Graph image generation via `ImageResponse` (e46d574).
- Observability logging to `ProblemRepository` (3a23337).
- Semantic helper methods (`success`, `error`, etc.) for `toast` notifications (fa038b1).
- Accessible close button to `DialogContent` (919f219).
- AI layer README and Genkit flow documentation (d41a37e).

### Changed
- Improved touch target size for problem status icons to 48px for better mobile accessibility (7b93fbe).
- Lazy loaded `TypingResults` component to optimize initial bundle size (3135cb2).
- Standardized animation tokens in Tailwind configuration (7ba2be8).
- Refactored `ProblemRepository` to flatten `fetchAllProblemsCore` logic (ce507d1).
- Enforced strict types in `UserRepository` (fab0b81).
- Standardized error handling for Server Actions (2878682).
- Hardened GPA validation in `EducationExperienceSchema` (2ca43e6).
- Replaced `framer-motion` with native CSS and Tailwind animations to reduce bundle size (f35c907, 459eb7d).
- Refactored `ProblemRepository` to reduce cyclomatic complexity (2a1b07b).
- Split `types/index.ts` into domain-specific modules (6dd1f92).
- Improved mobile touch targets for Input and Select components (bd52a4d).
- Centralized AdSense configuration and cleaned up `.env.example` (5b5f661).
- Optimized `CompanyList` resource usage (5f5ec8a).
- Hardened `WorkExperienceSchema` date validation (f2ab737).
- Removed deprecated `syncUserProfile` server action and added IDOR warnings (f59eef4).
- Improved accessibility of icon-only buttons (2c350b1).
- Improved `Button` accessibility during loading states (8079764).
- Optimized AI cooldown timer to prevent re-renders (1a8087c).
- Hardened company strategy generation flow (9ef49b9).
- Standardized hover scale tokens (3002eab).
- Enforced strict types for contact server action (234a16c).
- Updated Vercel configuration (06ae7d1).
- Refactored `ProblemRepository` to reduce complexity and improve maintainability (7cc7951).
- Refactored `Header` navigation to use `NavigationRegistry` for decoupled menu management (beb7598).
- Centralized `NEXT_PUBLIC_APP_URL` configuration handling (d737faf).
- Hardened Firestore backup and restore scripts (7ff3097).
- Refactored `Card` component to remove `forwardRef` in favor of React 19 patterns (14e01f0).
- Enforced Zod validation for inputs in `UserRepository` (4b65062).
- Optimized `ProblemList` rendering using derived state to prevent unnecessary re-renders (e851300).
- Enlarged small buttons on mobile to ensure minimum touch targets (6fff58f).
- Explicitly typed Firestore query constraints as `QueryConstraint[]` (2eccbd8).
- Removed unused `problemCount` prop from `ProblemList` to prevent unnecessary re-renders (3f720a9).

### Fixed
- Reduced toast notification removal delay from 16m to 5s to prevent memory leaks (3b66c44).
- Outdated documentation in Getting Started guide and README (7451759).
- Added `lastSyncedAt` to `UserProfile` to resolve type mismatch (8941d05).
- Unbounded cache growth and stale state in companies list (1f6af11).
- Accessible name mismatch in problem card unit tests (bc23662).
- JSON-LD injection issues and metadata typos (4281837).
- Timer churn in `useTypingGame` hook (277e947).
- Broken links in README and missing architecture diagram (1b343cc).

### Security
- Fixed JSON-LD XSS vulnerability by introducing `safeJsonLd` helper (0fca276).

## [0.1.0] - 2024-12-24
### Added
- `src/components/icons/google-icon.tsx` to replace `FcGoogle`.

### Changed
- Replaced `react-icons` with `lucide-react` across the codebase (ff09671).
- Updated `HeroSection`, `ShineButton`, `CompanySearchBar`, and `FEATURES` to use Lucide icons.

### Removed
- `react-icons` dependency.

[Unreleased]: https://github.com/arvindri2005/Byte-to-Offer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/arvindri2005/Byte-to-Offer/releases/tag/v0.1.0
