# Bridge's Journal

## 🌉 Bridge's Journal

This log tracks critical architectural discoveries, tight coupling "knots," and improvements made to the system's modularity.

### 🔍 Architectural Friction Log

#### [Date: Current] - Initial Survey
- **`src/lib/utils.ts`**: Contains a mix of unrelated utilities: Tailwind helpers, string manipulation, URL logic (with env dependency), and generic JS helpers. This is a mild "Everything Bagel".
- **`src/services/problem.service.ts`**: Uses `dynamic import` to load `UserService` inside methods to avoid circular dependencies. This is a "Knot" indicating that `ProblemService` and `UserService` are conceptually entangled (likely around "User Progress on Problems").
- **`src/components/ui/`**: 40+ components without a centralized entry point. Consumers must know the exact file path for every component (e.g., `import { Button } from "@/components/ui/button"`).
- **`src/services/user.service.ts`**: Contained low-level caching logic (Map, timestamps, manual eviction) mixed with high-level business logic. This was a "Leaky Abstraction" where the service had to manage memory constraints explicitly.

### 🌉 Spans (Improvements)

#### Extracted MemoryCache Utility
- **What**: Moved ad-hoc caching map and logic from `UserService` to `src/lib/memory-cache.ts`.
- **Why**: The service should focus on user operations, not memory management. The new generic `MemoryCache` class formalizes TTL and LRU-like eviction policies, making it reusable for other services (e.g., `CompanyService`) that use `unstable_cache` but might need in-memory backups.
- **Verification**: Unit tests confirmed TTL expiration works correctly.
