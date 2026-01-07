# Relic's Journal

## [2026-01-05] Modernization: Replaced local `useDebounce` with `use-debounce` package

**What:** Replaced the custom local implementation of `useDebounce` and `useDebouncedCallback` (in `src/hooks/use-debounce.ts`) with the standard `use-debounce` package, which was already installed but unused.

**Why:**
- **Standardization:** Using a well-maintained community library instead of a custom implementation.
- **Code Deletion:** Removed ~70 lines of redundant code and its associated test file.
- **Consistency:** Ensures consistent debouncing behavior across the application.

**Learnings:**
- **API Differences:** The `use-debounce` library's `useDebounce` hook returns a tuple `[value, control]`, whereas our local implementation returned the value directly. This required updating all call sites to destructure the return value: `const [debouncedValue] = useDebounce(value, delay)`.
- **Ghost Pattern:** The project had a "Ghost Pattern" where a library was installed (`use-debounce`) but a local "polyfill" was used instead. Always check installed dependencies before writing custom helpers.

**Cleanup:**
- Deleted `src/hooks/use-debounce.ts`
- Deleted `src/hooks/__tests__/use-debounce.test.ts`
- Updated 4 components to use the library.

## [2026-01-08] Modernization: Refactored `useMediaQuery` to `useSyncExternalStore`

**What:** Replaced the legacy `useState`/`useEffect` pattern in `src/hooks/use-media-query.ts` with the modern `useSyncExternalStore` API (React 18 standard). Also deleted the unused `src/hooks/use-network.ts` hook.

**Why:**
- **Modernization:** `useSyncExternalStore` avoids tearing in concurrent rendering and is the recommended way to subscribe to external stores like `matchMedia`.
- **Performance:** Correctly implemented with `useCallback` to prevent unnecessary re-subscriptions on every render.
- **Cleanup:** Removed dead code (`useNetwork`) which was untested and unused.

**Cleanup:**
- Deleted `src/hooks/use-network.ts`
- Added thorough tests for `useMediaQuery` covering reactivity.

**Verification:**
- Verified behavior is identical (returns boolean based on media query).
- Verified tests pass with 100% coverage for the hook.
