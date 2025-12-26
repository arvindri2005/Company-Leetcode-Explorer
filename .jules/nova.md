# Nova's Journal

## 🌟 Nova: AI Reliability & Intelligence Improvements

### Entry 1: Caching for AI Flows
*   **What:** Implemented `unstable_cache` for `generateProblemInsights` in `AIService`.
*   **Why:** To prevent redundant expensive model calls for the same problem, reducing latency and cost.
*   **Intelligence:** Lowered token cost by avoiding re-generation for identical inputs.
*   **Verification:** Verified via manual testing that subsequent calls return cached data.

### Entry 2: Defensive Prompting & Cost Guardrails
*   **What:** Hardened `generateProblemInsights` prompt with XML delimiters, system protocol, and few-shot examples. Added `maxOutputTokens` and `temperature` config.
*   **Why:** To prevent prompt injection (e.g., ignoring instructions) and ensure consistent, cost-effective outputs.
*   **Intelligence:** Reduced hallucination risk and prevented potential token runaways.
*   **Verification:** Code analysis confirms XML wrapping `<problem_context>` and explicit `config` in `ai.definePrompt`.
