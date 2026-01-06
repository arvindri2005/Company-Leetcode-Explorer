# 🪵 Cinder's Journal

## Critical Discoveries

### Typing Game Render Loop
- **Issue**: The `TypingTestGame` component was re-rendering the entire game tree every second to update a `wpmHistory` array.
- **Waste**: This array was only used to display a graph *after* the game finished. The 1Hz re-render during gameplay was pure overhead, consuming CPU and battery unnecessarily.
- **Fix**: Refactored `useTypingGame` to use a `useRef` accumulator for the history data. State is now only updated once when the game completes.
- **Verification**: Verified via test case that `wpmHistory` state remains empty during gameplay and populates on completion.
