# Nova's Journal: Flashcard Intelligence Hardening

## 🌟 Nova: Hardened Flashcard Generation

### 💡 What
I enhanced the `generateFlashcardsFlow` by implementing "Nova" protocols:
1.  **Defensive Prompting:** Added a `<system_protocol>` to enforce the persona of an "Expert Spaced Repetition Coach" and explicitly forbid "LeetCode Copy-Paste" behavior.
2.  **Few-Shot Examples:** Included a `<few_shot_example>` comparing a "Bad" generic flashcard vs. a "Good" insight-driven flashcard to guide the model's style.
3.  **Cost Guardrails:** Implemented a `MAX_PROBLEMS_FOR_CONTEXT = 20` limit in the code to truncate large problem lists before they hit the LLM context window.

### 🎯 Why
-   **Quality:** Previous flashcards often just restated the problem or gave a direct solution ("How to solve X? Use Y."). We want to test *concept understanding* ("Why use Y for X?").
-   **Cost/Reliability:** Companies can have hundreds of problems. Sending all of them to the model is wasteful (tokens) and can confuse the model with too much noise.
-   **Consistency:** The System Protocol ensures the model behaves consistently regardless of the specific company data quality.

### 🧠 Intelligence
-   **Reduced Hallucination Rate:** By grounding the model with specific examples of what *not* to do.
-   **Lowered Token Cost:** The truncation ensures we never send massive payloads for companies with 500+ reported questions.

### 🔬 Verification

**Input:**
```json
{
  "companyName": "TechCorp",
  "problems": [
    { "title": "Two Sum", "difficulty": "Easy", "tags": ["Array", "Hash Table"] },
    { "title": "LRU Cache", "difficulty": "Medium", "tags": ["Hash Table", "Linked List", "Design"] }
  ]
}
```

**Old Output (Simulated/Typical):**
-   *Front:* "How do you solve Two Sum?"
-   *Back:* "Use a Hash Map to store values."

**New Output (Actual):**
-   *Front:* "For problems like 'Two Sum', what data structure enables O(1) average time complexity lookup, and why is it better than a simple array search?"
-   *Back:* "A Hash Table (or HashMap/Dictionary). It allows checking for the existence of the required complement (target - current_value) in near constant time, reducing the overall complexity from O(N^2) for brute force to O(N)."
