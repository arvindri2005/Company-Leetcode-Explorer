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
