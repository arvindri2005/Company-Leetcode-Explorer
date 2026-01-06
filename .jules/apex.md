# Apex Journal

## 2024-05-21: AI Service Extension Registry

### Discovery
The `AIService` (`src/services/ai.service.ts`) was tightly coupled to specific AI flow implementations. Adding a new AI capability required modifying the service class, violating the Open-Closed Principle. This rigidity made it difficult to A/B test different flow implementations or add experimental features without code churn in the core service.

### Improvement
Refactored `AIService` to use a `AIFlowRegistry` (`src/ai/flow-registry.ts`).

- **What:** Introduced a singleton registry where AI flows are registered by name. The `AIService` now looks up flows from this registry instead of importing them directly.
- **Why:** This decouples the service from the implementation. Flows can be swapped at runtime (e.g., for testing or different environments) or added dynamically.
- **Scalability:** New AI features can be added by registering a new flow. While `AIService` currently has specific methods for type safety, this pattern paves the way for a more generic `executeFlow` method if needed.
- **Verification:** Added `src/services/__tests__/ai-extensibility.test.ts` which demonstrates how to override a core flow (`groupQuestions`) with a mock implementation without touching the service code.

### Lessons
- **Type Safety vs. Extensibility:** The main challenge was maintaining strict input/output typing while using a generic registry. We kept the specific methods in `AIService` to preserve the API contract but delegated the execution to the registered flow. A fully generic `execute` method would require more complex type mapping.
