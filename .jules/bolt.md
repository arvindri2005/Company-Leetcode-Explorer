# BOLT'S JOURNAL - CRITICAL LEARNINGS ONLY

## 2024-05-23 - Hydration Mismatches & Performance
**Learning:** `useEffect` + `useState` for media queries causes a double render on mount and a hydration mismatch error (server: false vs client: true). `useSyncExternalStore` is the correct solution for subscribing to external browser APIs.
**Action:** When migrating hooks that track browser state, use `useSyncExternalStore` and ensure `getSnapshot` is memoized or stable to avoid unnecessary re-reads of the value.
