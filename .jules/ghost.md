# Ghost's Haunt 👻

This journal records critical learnings related to Perceived Performance and Skeleton UI.

## 2024-05-23 - Problems Page [Layout Mismatch]
**Structure:** The Problems Page was using a generic text fallback ("Loading problems...") causing a layout shift when the grid/list loaded.
**Poltergeist:** Implemented `ProblemsPageSkeleton` mirroring `AllProblemsList` structure (Controls + Card List). Mimicked `ProblemCard` dimensions exactly (h-8 buttons, gap-3 spacing) to ensure 0 CLS during transition.

## 2026-01-02 - Profile Page [Layout Mismatch]
**Structure:** The Profile Page was using a generic full-screen `<Skeleton />` during authentication loading, causing a jarring transition to the complex dashboard layout (Sidebar + Tabs).
**Poltergeist:** Implemented `ProfilePageSkeleton` comprising `UserInfoCardSkeleton` and `ProgressStatsSkeleton`. Replicated the exact grid layout (`grid-cols-12`) and the responsive Tab navigation to ensure a smooth, stable loading experience.
