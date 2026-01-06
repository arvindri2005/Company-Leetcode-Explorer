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
