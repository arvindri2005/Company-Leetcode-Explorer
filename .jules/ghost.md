# Ghost's Haunt 👻

This journal records critical learnings related to Perceived Performance and Skeleton UI.

## 2024-05-23 - Problems Page [Layout Mismatch]
**Structure:** The Problems Page was using a generic text fallback ("Loading problems...") causing a layout shift when the grid/list loaded.
**Poltergeist:** Implemented `ProblemsPageSkeleton` mirroring `AllProblemsList` structure (Controls + Card List). Mimicked `ProblemCard` dimensions exactly (h-8 buttons, gap-3 spacing) to ensure 0 CLS during transition.

## 2024-05-24 - Profile Experience Sections [Layout Mismatch]
**Structure:** Work and Education Experience sections used a generic `h-20` Skeleton bar, which was shorter and less complex than the actual `Card` content (Title, Subtitle, Description), causing layout expansion upon data load.
**Poltergeist:** Implemented `WorkExperienceSkeleton` and `EducationExperienceSkeleton` in `experience-skeleton.tsx`. These mirror the exact structure of the loaded cards: `rounded-xl`, `p-6`, with internal skeletons for Title (`h-6`), Date/Subtitle (`h-4`), and Body (`space-y-2` text blocks), ensuring a seamless transition.
