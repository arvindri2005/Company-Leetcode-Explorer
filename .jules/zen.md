## 2024-05-24 - Decomposing Problem Repository
Discord: `fetchProblemsByCompanyCore` was a 180-line function mixing two distinct pagination strategies (Optimized vs Semi-Optimized) with deep nesting and variable scope pollution.
Harmony: Extracted `fetchProblemsByCompanyOptimized` and `fetchProblemsByCompanySemiOptimized` as private helper methods. The main function now acts as a clear router between strategies, reducing max nesting from 5 to 2 levels.

## 2024-06-03 - Flattening Problem Service
Discord: `getAllProblemsPaginated` mixed data fetching, caching, and conditional user-enrichment logic in a single flow, violating the Single Responsibility Principle and creating unnecessary nesting for the authenticated path.
Harmony: Extracted `enrichProblemsWithUserData` as a private helper and used a guard clause to handle the unauthenticated case early. This separates "fetching data" from "enhancing data," reducing cognitive load.
