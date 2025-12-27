# Ghost's Haunt 👻

This journal records critical learnings related to Perceived Performance and Skeleton UI.

## 2024-05-23 - Problems Page [Layout Mismatch]
**Structure:** The Problems Page was using a generic text fallback ("Loading problems...") causing a layout shift when the grid/list loaded.
**Poltergeist:** Implemented `ProblemsPageSkeleton` mirroring `AllProblemsList` structure (Controls + Card List). Mimicked `ProblemCard` dimensions exactly (h-8 buttons, gap-3 spacing) to ensure 0 CLS during transition.
