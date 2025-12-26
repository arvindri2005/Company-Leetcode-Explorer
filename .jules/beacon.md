# Beacon's Journal 🚨

## Critical Discoveries

### 2024-05-22: Blind Spot in Problem Repository (Semi-Optimized Path)
**Severity:** High (Observability)
**Component:** `ProblemRepository.fetchProblemsByCompanyCore`
**Issue:**
The "Semi-Optimized Path" for fetching company problems (used when search terms or complex filters are present) fetches up to 200 documents and filters them in memory.
- **Silent Failures:** This logic block was not wrapped in a `try-catch`, meaning Firestore errors would propagate up without context.
- **Missing Metrics:** We had no visibility into:
    1. How many documents were fetched vs. how many survived filtering (efficiency ratio).
    2. Execution time (latency).
    3. Which filters caused data drops.

**Resolution:**
Wrapped the logic in a `try-catch` block and added structured logging to track:
- `fetchedCount`: Raw docs from Firestore.
- `filteredCount`: Docs remaining after in-memory filtering.
- `durationMs`: Execution time.
- `filterStats`: Which filters were active.

This allows us to diagnose "missing problem" reports and monitor performance of the in-memory filtering strategy.
