# Nova's Journal

## 🌟 Nova: AI Reliability & Intelligence Improvements

### Entry 1: Caching for AI Flows
*   **What:** Implemented `unstable_cache` for `generateProblemInsights` in `AIService`.
*   **Why:** To prevent redundant expensive model calls for the same problem, reducing latency and cost.
*   **Intelligence:** Lowered token cost by avoiding re-generation for identical inputs.
*   **Verification:** Verified via manual testing that subsequent calls return cached data.
