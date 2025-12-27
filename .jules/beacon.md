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

### 2024-05-22: Unmonitored AI Actions (Duration & Context)
**Severity:** Medium (Observability)
**Component:** `src/app/actions/ai.actions.ts`
**Issue:**
AI actions (Question Grouping, Similar Questions, Strategy Generation, etc.) were "black boxes".
- **Generic Errors:** Used `console.error` directly, bypassing the structured `Logger`.
- **Missing Metrics:** No visibility into how long AI calls take (which can be seconds to minutes).
- **Missing Context:** Errors didn't explicitly include user inputs (like slugs or IDs) in the log metadata, making it hard to reproduce specific failures.

**Resolution:**
Instrumented all exported functions in `ai.actions.ts` to:
- Log a "Started" event with input metadata (e.g., `problemCount`, `companyId`).
- Measure execution duration (`durationMs`).
- Log a "Completed" event with duration and result stats (e.g., `flashcardCount`).
- Log "Error" events using `Logger.error` with the full context and duration.

This allows us to monitor AI performance, costs (implied by duration/counts), and debug failures with specific inputs.
