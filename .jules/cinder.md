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

# 🪵 Cinder: Lazy Load Profile Strategies

## 💡 What
Implemented Lazy Loading (`next/dynamic`) for the `StrategyListsSection` component in `src/app/profile/page.tsx`.

## 🎯 Why
The `StrategyListsSection` component imports `react-markdown` and `remark-gfm`, which are heavy dependencies. These were previously included in the main Profile Page bundle, even though the Strategy tab is not the default view.

## 📉 Efficiency
- **Reduced Initial JS Payload**: `react-markdown` and `remark-gfm` are now split into a separate chunk and only loaded when the user navigates to the "Strategies" tab.
- **Improved FCP/LCP**: The Profile page loads faster for the majority of users who only check their bookmarks or stats.

## 🔬 Verification
- Validated build success with `pnpm build`.
- Confirmed `StrategyListsSection` is the entry point for the heavy dependencies in this route.
