# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
- Refactored `ProblemRepository` to reduce complexity and improve maintainability (7cc7951).
- Refactored `Header` navigation to use `NavigationRegistry` for decoupled menu management (beb7598).
- Centralized `NEXT_PUBLIC_APP_URL` configuration handling (d737faf).
- Hardened Firestore backup and restore scripts (7ff3097).
- Refactored `Card` component to remove `forwardRef` in favor of React 19 patterns (14e01f0).
- Enforced Zod validation for inputs in `UserRepository` (4b65062).
- Optimized `ProblemList` rendering using derived state to prevent unnecessary re-renders (e851300).
- Enlarged small buttons on mobile to ensure minimum touch targets (6fff58f).
- Explicitly typed Firestore query constraints as `QueryConstraint[]` (2eccbd8).

### Fixed
- Unbounded cache growth and stale state in companies list (1f6af11).
- Accessible name mismatch in problem card unit tests (bc23662).
- JSON-LD injection issues and metadata typos (4281837).
- Timer churn in `useTypingGame` hook (277e947).
- Broken links in README and missing architecture diagram (1b343cc).

### Security
- Fixed JSON-LD XSS vulnerability by introducing `safeJsonLd` helper (0fca276).

## [0.1.0] - 2025-12-24
### Added
- `src/components/icons/google-icon.tsx` to replace `FcGoogle`.

### Changed
- Replaced `react-icons` with `lucide-react` across the codebase (ff09671).
- Updated `HeroSection`, `ShineButton`, `CompanySearchBar`, and `FEATURES` to use Lucide icons.

### Removed
- `react-icons` dependency.
