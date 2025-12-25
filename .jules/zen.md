## 2025-02-18 - The Hydra's Heads
**Discord:** `fetchProblemsByCompanyCore` was a 200-line beast mixing query construction, optimized execution, and fallback in-memory filtering in a single nested scope.
**Harmony:** Extracted `fetchProblemsByCompanyOptimized` and `fetchProblemsByCompanyInMemory`. The main function now simply directs traffic based on filter capability. One function, one level of abstraction.
