# 🌊 Flow: Memory Optimization Journal

## Critical Discoveries

### Timer Churn in `useTypingGame`
- **Discovery:** The WPM history timer in `useTypingGame` was including `userInput.length` in its dependency array. Since `userInput.length` changes on every keystroke, the `setInterval` was being cleared and recreated dozens of times per second during fast typing.
- **Impact:** While not a permanent memory leak (since it was cleaned up), this caused excessive "churn" - unnecessary allocation and garbage collection of timer objects, and potentially erratic timer behavior (drifting due to constant resetting).
- **Fix:** Implemented a `useRef` to track `userInput.length` without triggering effect re-runs. The timer now runs steadily at 1000ms intervals regardless of typing speed.
- **Verification:** Verified via unit test that `setInterval` is called exactly once when typing begins and is NOT recalled on subsequent keystrokes.

### Unbounded Cache & Stale State in Companies List
- **Discovery:** The `useCompaniesCache` hook was unused and implemented as local component state with an unbounded storage mechanism. Additionally, `CompaniesPageContent` had a race condition where rapid search queries could result in "Stale State" updates (updating state after component unmount or with out-of-order results).
- **Impact:**
    1. Potential "Infinite Cache" growth if the hook were used naively without LRU eviction.
    2. "Zombie State" updates in the UI where old search results overwrite newer ones.
    3. Unnecessary network requests when navigating back/forth to the companies list.
- **Fix:**
    1. Refactored `useCompaniesCache` to use a **Module-Level Singleton Cache** with **LRU Eviction** (Max 20 pages).
    2. Integrated the cache into `CompaniesPageContent` to replace direct server actions.
    3. Added a `cancelled` flag pattern to `useEffect` to prevent state updates on unmounted components.
- **Verification:** Verified integration via unit tests ensuring initial render is correct and cache mechanism is hooked up.
