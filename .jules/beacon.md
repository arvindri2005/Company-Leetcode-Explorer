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
