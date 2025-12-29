# 🪵 Cinder: Lazy Load Typing Results

## 💡 What
Implemented Lazy Loading (`next/dynamic`) for the `TypingResults` component in `src/components/tools/typing-test/typing-test-game.tsx`.

## 🎯 Why
The `TypingResults` component imports `recharts`, a heavy visualization library. By default, this library was included in the initial bundle of the Typing Test tool, even though results are only shown *after* the user finishes the test.

## 📉 Efficiency
- **Reduced Initial JS Payload**: The `recharts` library (~45KB min+gzip) is now split into a separate chunk and only loaded when the test finishes.
- **Improved TTI**: The Typing Test tool loads faster for users, as they don't need to download the charting library to start typing.

## 🔬 Verification
- Verified code change using `next/dynamic` with a Skeleton fallback.
- Confirmed `TypingResults` is the only consumer of `recharts` in this sub-tree.
