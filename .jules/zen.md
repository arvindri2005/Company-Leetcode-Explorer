# Zen Koans - Critical Refactoring Learnings

This journal records critical discoveries about complexity, architectural debt, and opportunities for simplification.

## Format
## YYYY-MM-DD - [Title]
Discord: [Complexity observed]
Harmony: [Simplification pattern]

## 2024-05-24 - Decomposing Problem Repository
Discord: `fetchProblemsByCompanyCore` was a 180-line function mixing two distinct pagination strategies (Optimized vs Semi-Optimized) with deep nesting and variable scope pollution.
Harmony: Extracted `fetchProblemsByCompanyOptimized` and `fetchProblemsByCompanySemiOptimized` as private helper methods. The main function now acts as a clear router between strategies, reducing max nesting from 5 to 2 levels.
