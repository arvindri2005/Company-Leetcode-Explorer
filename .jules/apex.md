# Apex Journal

## 🏔️ Extensibility Improvement: Problem Filter Registry

### 💡 What
Replaced the hardcoded filtering logic in `ProblemRepository` with a `ProblemFilterRegistry`. This allows adding new filters (like `status`, `tags`, etc.) without modifying the core query construction logic.

### 🎯 Why
Previously, adding a new filter required:
1. Modifying `FetchProblemsParams`
2. Modifying `buildQueryConstraints` with new if/else blocks
3. Managing the complex "single 'in' operator" rule manually
4. Updating `fetchProblemsByCompanySemiOptimized` to handle the new filter in-memory

Now, you simply:
1. Implement `ProblemFilter` interface
2. Register it in `problemFilterRegistry`

### 🏗️ Scalability
The `ProblemFilterRegistry` acts as a resource manager for the Firestore query limitations (e.g., tracking the single `in` operator usage). It automatically degrades filters to "residual" (in-memory) status if the database capabilities are exhausted.

### 🔬 Verification
- Created unit tests in `src/lib/problem-filters/__tests__/registry.test.ts` to verify the registry's arbitration logic (prioritizing `==` over `in` and handling multiple `in` requests).
- Verified `pnpm typecheck` passes.
- Verified `pnpm test` passes.

### ⚠️ Notes
- `fetchProblemsSemiOptimized` (used by "All Problems" view) still uses legacy signature for now, but `getProblemsByCompany` (the main view) uses the fully extensible path.
