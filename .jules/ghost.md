## 2025-12-31 - Layout Mismatch in Profile Page
**Structure:** The Profile Page used a full-screen generic skeleton `h-screen w-full` which caused a massive layout shift when the actual 2-column grid layout (UserInfo + Tabs) loaded.
**Poltergeist:** Created `ProfilePageSkeleton` that mirrors the exact 2-column grid structure, including `UserInfoCardSkeleton` (Avatar, Name, Badges), `ProgressStatsSkeleton` (3-card grid), and `ProfileTabsSkeleton` (Tab triggers + content). This ensures the sidebar and main content areas are reserved immediately.

## 2025-12-31 - Generic Skeleton in Problems Page
**Structure:** The Problems Page was using an inline generic skeleton `h-10 w-full` + `h-24 w-full` loop, which didn't match the specific internal layout of `ProblemCard` (e.g., status circle, difficulty badge, action buttons).
**Poltergeist:** Replaced inline skeleton with `ProblemsPageSkeleton` from `@/components/skeletons/problem-skeletons`, ensuring pixel-perfect alignment with the actual `ProblemCard` component.

## 2025-12-31 - Header Auth Loading State
**Structure:** The Header used a text-based "Loading..." span or a generic spinner for auth links, causing a width jump when the "Login/Signup" or "Profile" buttons loaded.
**Poltergeist:** Implemented a targeted `Skeleton` (`h-9 w-20 bg-white/10`) for the auth section in the Header, preserving the exact button dimensions during the auth check.
