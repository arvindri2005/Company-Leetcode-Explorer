# Apex Journal 🏔️

## 2025-02-12: Navigation Registry

### 🔍 Discovery
The `Header` component contained rigid, hardcoded navigation links (`/companies`, `/problems`, etc.) mixed with authentication logic. Adding a new link required modifying the core component.

### 🔧 Implementation
I implemented a `NavigationRegistry` singleton in `src/lib/navigation-registry.ts`.
- **What:** A registry that allows modules to register navigation items with properties like `label`, `href`, `position`, `order`, and `isVisible`.
- **Why:** This decouples the "what" (links) from the "how" (rendering). Plugins or other modules can now inject links into the header without touching `header.tsx`.
- **Pattern:** Registry Pattern.
- **Trade-off:** "Logout" remains hardcoded in the `Header` component because it relies on `useRouter` and `useToast` hooks which are difficult to serialize or inject into a static registry without a full DI system.

### 🏗️ Scalability
- Future features (e.g., "Admin Dashboard") can register their own links conditionally based on user roles.
- Mobile menu automatically picks up new items.

### 🔬 Verification
- Unit tests in `src/lib/__tests__/navigation-registry.test.ts` verify registration, ordering, and visibility logic.
- `Header` component refactored to consume the registry.

## 2026-01-02: Cache Strategy Pattern

### 🔍 Discovery
The caching logic in `CompanyService` (and others) was tightly coupled to Next.js's `unstable_cache` with hardcoded TTL values (e.g., `2592000` seconds) scattered throughout the service methods. This "Rigid Logic" made it impossible to globally adjust caching strategies or swap the provider.

### 🔧 Implementation
I implemented a Cache Strategy Pattern:
- **What:** Defined `CachePolicy` constants (TTL) and a `CacheAdapter` interface in `src/lib/cache/types.ts`. Implemented `NextCacheAdapter` and exposed a global `cacheManager` singleton.
- **Why:** This adheres to the Open-Closed Principle. The core services now depend on an abstraction (`cacheManager`) rather than a concrete implementation (`unstable_cache`).
- **Pattern:** Strategy/Adapter Pattern.

### 🏗️ Scalability
- Standardized TTLs (`STATIC`, `DAILY`, `SHORT`) ensure consistency across the app.
- Future adapters (e.g., Redis) can be swapped in `src/lib/cache/index.ts` without touching service logic.

### 🔬 Verification
- **Unit Tests:** Created `src/lib/cache/__tests__/next-cache-adapter.test.ts` to verify the adapter wraps Next.js correctly.
- **Service Verification:** Refactored `CompanyService` and verified via `src/services/__tests__/company.service.test.ts` that it uses the manager with correct options.
