# Apex Journal

## 2024-05-24: Navigation Registry

### 🔍 SURVEY
Found "Rigid Logic" in `src/components/layout/header.tsx`. The navigation links (`Explore Companies`, `Problems`) were hardcoded in a `commonNavLinks` array. This made it impossible for other modules (like a Blog module or a Community plugin) to add their own navigation links without modifying the core Header component.

### 🏔️ SELECT
Chose to implement a **Navigation Registry** pattern. This allows any part of the application (or future plugins) to register navigation links dynamically.

### 🔧 UNLOCK
1.  **Created `src/lib/navigation-registry.ts`**: A singleton registry that manages a list of `NavigationLink` objects. It supports priorities for sorting and visibility callbacks.
2.  **Created `src/contexts/navigation-context.tsx`**: A React Context that wraps the application and syncs with the registry. This allows components to reactively update when new links are registered.
3.  **Refactored `src/components/layout/header.tsx`**: Replaced the hardcoded links with `useNavigation()`. The Header now iterates over the registered links.
4.  **Refactored `src/app/layout.tsx`**: Added `NavigationProvider` to the global layout.

### ✅ VERIFY
- Verified that the default links ("Explore Companies", "Problems") are still present and functional.
- Verified that the architecture supports adding new links via `navigationRegistry.register()`.
- Added validation to prevent invalid or duplicate links from crashing the registry.
- Ensured that client-side components can dynamically register links (e.g., in a `useEffect`).

### 🎁 PRESENT
- **What**: Replaced hardcoded navigation links with a dynamic `NavigationRegistry`.
- **Why**: Allows future features (e.g., Blog, Community, Admin Dashboard) to add menu items without touching the core `Header` component.
- **Scalability**: Modules can now "plug in" their own UI entry points.
- **Verification**: Tested with a temporary plugin component that successfully injected a "Test Plugin" link into the live header.
