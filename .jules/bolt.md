## 2024-05-23 - Cache Key Canonicalization for Array Filters
**Learning:** Cache keys generated from parameters involving arrays (like filters) are sensitive to order. `['A', 'B']` and `['B', 'A']` generate different cache keys if using `JSON.stringify` directly, leading to cache fragmentation and lower hit rates.
**Action:** Always sort array parameters before generating a cache key to ensure canonicalization. Implemented this in `ProblemService` by sorting `difficultyFilter` and `lastAskedFilter`.
