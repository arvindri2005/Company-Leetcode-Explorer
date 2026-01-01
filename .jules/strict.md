## 2024-05-24 - Heterogeneous Registry Pattern
Constraint: Storing generic filters in a `Record<string, unknown>` and iterating them requires strict typing for values.
Solution: Use `ProblemFilter<T = unknown>` with a mandatory type guard `isValidValue(value: unknown): value is T`. The registry iterates `unknown` values and calls `filter.isValidValue(val)` before passing them to typed methods. This eliminates `any` casts while maintaining type safety.
