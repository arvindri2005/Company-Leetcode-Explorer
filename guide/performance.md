# Performance & Scalability Guidelines

To ensure our application scales well and remains performant as it grows, we follow these best practices tailored for Next.js and modern Web Development.

## 1. Rendering Strategies

Understanding when to use Server vs. Client components is critical for performance.

### Server Components (Default)
*   **Use for**: Data fetching, accessing backend resources directly, keeping sensitive data on the server, large dependencies.
*   **Benefit**: Zero bundle size impact on the client, faster initial page load (FCP).

### Client Components (`"use client"`)
*   **Use for**: Interactivity (`useState`, `useEffect`), Event listeners (`onClick`), utilizing browser APIs (`localStorage`, `window`).
*   **Best Practice**: Move the "Client Boundary" as deep as possible. Import Client Components *into* Server Components, not the other way around if possible.

## 2. Image Optimization

*   **Next/Image**: Always use the built-in `<Image />` component instead of `<img>`.
    *   Automatic resizing and format optimization (WebP/AVIF).
    *   Prevents Layout Shift (CLS) by requiring width/height.
*   **Priority**: Use the `priority` prop for LCP (Largest Contentful Paint) images (e.g., Hero images) to load them immediately.

```tsx
import Image from 'next/image';

<Image 
  src="/hero.png" 
  alt="Hero" 
  width={800} 
  height={600} 
  priority 
/>
```

## 3. Code Splitting & Lazy Loading

### Routes
Next.js automatically code-splits per page. Ensure you are not importing heavy libraries globally in `layout.tsx` unless absolutely necessary.

### Components
Use `next/dynamic` to lazy load heavy components that are not critical for the initial render (e.g., Modals, Charts, distinct sections below the fold).

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <p>Loading...</p>,
  ssr: false // If the component relies on browser APIs
});
```

## 4. State Management at Scale

*   **Local State**: Use `useState` for simple, co-located UI state.
*   **URL State**: Use the URL (Query Params) for shareable state (filtering, sorting, pagination). This is the best practice for scalability and UX.
*   **Server State**: Rely on Next.js caching and mutation patterns (Server Actions) rather than complex global client stores if possible.

## 5. Bundle Analysis

Periodically analyze the bundle size to catch bloating dependencies.

*   Run `npm run build` and check the build output for large "First Load JS".
*   Use `@next/bundle-analyzer` if you need to visualize the tree.

## 6. General Optimizations

*   **Debouncing**: Debounce expensive inputs (like Search) to reduce server load.
*   **Memoization**: Use `useMemo` and `useCallback` judiciously.
    *   *Do* use them for referential equality in dependency arrays or expensive calculations.
    *   *Don't* use them for every single function (premature optimization adds overhead).
