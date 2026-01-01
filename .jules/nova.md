# Nova Journal

## 🌟 Nova: Smart Truncation & Schema Hardening for Problem Insights

### 💡 What
Implemented a dual-layer hardening strategy for the `generateProblemInsights` AI flow:
1.  **Smart Input Truncation**: Instead of hard-chopping the `problemDescription` at 2000 characters, the logic now seeks the last sentence boundary (period, question mark, exclamation point, or newline) within the limit. This prevents sending broken partial sentences to the model, reducing noise.
2.  **Strict Schema Validation**: Updated the Zod output schema to enforce specific character limits on array items (`keyConcepts` < 80 chars, `commonDataStructures` < 50 chars) and the hint (`highLevelHint` < 300 chars).

### 🎯 Why
*   **Reliability**: Prevents the model from hallucinating based on incomplete sentence fragments at the end of the context window.
*   **Quality**: Forces the model (via schema constraints) to be concise, aligning with the "high-level hint" goal rather than generating verbose explanations that might leak the solution.
*   **Cost**: Maintains the 2000-character cost guardrail while improving the semantic value of the tokens sent.

### 🧠 Intelligence
*   **Reduced Noise**: By ensuring the context ends on a complete thought, we reduce the "garbage in, garbage out" risk.
*   **Enforced Conciseness**: The model is now programmatically bound to provide short, punchy concepts, improving the UX for users who just want a quick hint.

### 🔬 Verification
*   **Input**: A 2500-char description ending in "...and then you must calculate the" (at char 2000).
*   **Old Behavior**: Sent "...and then you must calculate the...(truncated)" to the model.
*   **New Behavior**: Detects the last period at char 1950 and sends "...(previous sentence). ...(truncated)", ensuring clean context.
*   **Tests**: Verified via `src/ai/flows/__tests__/generate-problem-insights-flow.test.ts`.

## 🌟 Nova: Implemented "Cost Guardrails" for Strategy Generation

### 💡 What
Implemented strict truncation logic in the `generateCompanyStrategyFlow` AI flow.
- **Work History Limit:** Max 5 items.
- **Responsibilities Truncation:** Max 500 characters per role.
- **Education History Limit:** Max 5 items.

### 🎯 Why
The `WorkExperienceSchema` allowed unbounded `responsibilities` text. A user with a verbose resume or malicious intent could paste massive amounts of text, causing:
1.  **Token Explosion**: Exceeding the model's context window or costing significantly more per request.
2.  **Prompt Dilution**: Distracting the model from the core task (analyzing coding problems) with irrelevant biographical data.

### 🧠 Intelligence
- **Lowered Token Cost**: Prevents worst-case scenarios where input could be 10x larger than necessary.
- **Context Focus**: Ensures the model focuses on the most recent and relevant experience rather than a complete autobiography.

### 🔬 Verification
Run `pnpm jest src/ai/flows/__tests__/generate-company-strategy-flow.test.ts` to verify.

**Input -> Old Output (Simulated):**
- Work History: 10 items, 2000 chars each = ~20,000 chars of context.

**Input -> New Output:**
- Work History: 5 items, 500 chars each = ~2,500 chars max.
- **Reduction**: ~87% reduction in worst-case token usage for biography section.
