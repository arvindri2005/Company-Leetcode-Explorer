# 🌊 Flow: Memory Optimization Journal

## Critical Discoveries

### Timer Churn in `useTypingGame`
- **Discovery:** The WPM history timer in `useTypingGame` was including `userInput.length` in its dependency array. Since `userInput.length` changes on every keystroke, the `setInterval` was being cleared and recreated dozens of times per second during fast typing.
- **Impact:** While not a permanent memory leak (since it was cleaned up), this caused excessive "churn" - unnecessary allocation and garbage collection of timer objects, and potentially erratic timer behavior (drifting due to constant resetting).
- **Fix:** Implemented a `useRef` to track `userInput.length` without triggering effect re-runs. The timer now runs steadily at 1000ms intervals regardless of typing speed.
- **Verification:** Verified via unit test that `setInterval` is called exactly once when typing begins and is NOT recalled on subsequent keystrokes.
