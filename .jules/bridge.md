# Bridge's Journal

## 🌉 Bridge's Journal

This log tracks critical architectural discoveries, tight coupling "knots," and improvements made to the system's modularity.

### 🔍 Architectural Friction Log

#### [Date: Current] - Initial Survey
- **`src/lib/utils.ts`**: Contains a mix of unrelated utilities: Tailwind helpers, string manipulation, URL logic (with env dependency), and generic JS helpers. This is a mild "Everything Bagel".
- **`src/services/problem.service.ts`**: Uses `dynamic import` to load `UserService` inside methods to avoid circular dependencies. This is a "Knot" indicating that `ProblemService` and `UserService` are conceptually entangled (likely around "User Progress on Problems").
- **`src/components/ui/`**: 40+ components without a centralized entry point. Consumers must know the exact file path for every component (e.g., `import { Button } from "@/components/ui/button"`).
- **Inconsistent Caching Strategy**: `CompanyService` uses the `CacheManager` adapter, while `ProblemService` and `AIService` were directly importing `unstable_cache` from `next/cache`, creating leaky abstractions and testing difficulties.

### 🌉 Spans (Improvements)

#### 🌉 Standardize Caching Strategy
- **Why**: Decouple services from `next/cache` and enforce the Adapter pattern established by `CompanyService`.
- **Action**: Refactored `ProblemService` and `AIService` to use `cacheManager`.
- **Discovery**: The `revalidateTag` function from `next/cache` (v16.0.10) seems to require a second argument in this environment, causing type errors when used with the standard single-argument signature. Patched `NextCacheAdapter` to suppress this type error.
