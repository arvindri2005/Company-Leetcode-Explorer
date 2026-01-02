# Beacon's Journal 🚨

## 2024-05-23: API Route Observability Gap
### Discovery
While scanning the codebase, I found that `src/app/api/companies/[companyId]/ai-problems/route.ts` uses `console.error` directly instead of the structured `Logger` utility. This makes it a "black box" in production logs as it lacks context like request IDs, timestamps in a standard format, and severity levels consistent with the rest of the application.

### The Fix
I will replace `console.error` with `Logger.error` and ensure the error message captures the relevant context (companyId).

## 2024-05-23: AI Flow Observability
### Discovery
The AI flows (e.g., `src/ai/flows/group-questions.ts`) use `ai.defineFlow` but seemingly lack internal logging for duration, token usage, or specific failure reasons beyond throwing an error. While `unstable_cache` is used, cache hits/misses are silent.

### Opportunity
Adding a "wrapper" or interceptor for AI flows to log:
- Input size (number of questions)
- Execution time
- Success/Failure
would be valuable. However, given the "one small improvement" constraint, fixing the API route is a lower hanging fruit and ensures consistency first.

## 2024-05-24: Public API Blind Spot
### Discovery
The public API endpoint `/api/problems` was operating as a "black box". It logged when a request was received (`called`), but provided no visibility into:
- **Duration:** How long the request took (critical for identifying slow DB queries).
- **Completion:** Whether it succeeded or failed silently after the initial log.
- **Traceability:** No unique Request ID to correlate logs across services or retry attempts.

### The Fix
I implemented a standardized Observability Pattern in `src/app/api/problems/route.ts`:
1. **Request ID:** Generated a `crypto.randomUUID()` at the start of the handler.
2. **Duration Tracking:** Captured `startTime` and logged `durationMs` on completion (success or error).
3. **Structured Context:** Included `companyId`, `cursor`, `filters`, and `resultCount` in the logs to aid debugging without leaking PII (explicitly setting `userId` to undefined).
4. **Safety:** Ensured parameter parsing is wrapped in `try/catch` to guarantee structured error responses.

This transforms a simple "it ran" log into a rich telemetry event: `[API] /api/problems (GET) completed { requestId: '...', durationMs: 145, resultCount: 15, ... }`.
