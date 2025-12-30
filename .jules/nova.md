# Nova's Journal: Problem Insights Hardening

## 🌟 Nova: Hardened Problem Insights Generation

### 💡 What
I improved the `generateProblemInsightsFlow` by applying "Nova" protocols:
1.  **Cost Guardrails:** Implemented a hard limit of **2000 characters** for the `problemDescription` input. Longer descriptions are now truncated before being sent to the model.
2.  **Defensive Prompting:** Added a `<system_protocol>` block to the prompt, explicitly defining the "Nova" persona (Expert Coding Coach) and setting strict boundaries (e.g., "No Solution Code").
3.  **Few-Shot Learning:** Included a `<few_shot_example>` demonstrating the desired output format and quality (conceptual hints vs. direct answers) using a standard "Two Sum" example.

### 🎯 Why
-   **Cost:** Prevents massive token usage if a user (or bot) submits an extremely long problem description or copy-pastes an entire chapter of a book.
-   **Reliability:** The system protocol ensures the model stays in character and resists attempts to "jailbreak" or extract full solution code.
-   **Quality:** The few-shot example grounds the model, ensuring it provides high-level conceptual hints rather than generic advice or giving away the answer.

### 🧠 Intelligence
-   **Lowered Token Cost:** Input truncation guarantees a maximum token consumption per request, regardless of input size.
-   **Reduced Hallucination Rate:** By providing a concrete example and strict protocol, the model is less likely to deviate from the expected output structure.

### 🔬 Verification

**Input (Simulated Long Description):**
```json
{
  "title": "Massive Problem",
  "difficulty": "Hard",
  "tags": ["DP"],
  "problemDescription": "A... [5000 chars] ...Z"
}
```

**Old Behavior:**
-   Sent all 5000+ characters to the model.
-   Risked hitting token limits or incurring high costs.
-   Prompt lacked explicit examples, leading to variable output quality.

**New Behavior:**
-   Truncates description to 2000 chars + "...(truncated)".
-   Prompt includes "System Protocol" and "Few-Shot Example".
-   Output remains focused on concepts and hints.
