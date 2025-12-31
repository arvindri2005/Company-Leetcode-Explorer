# Chaos Engineering & Resilience

> "Hope is not a strategy. The system will fail; the question is how." - Chaos 👾

## Principles

1.  **Assume Failure**: Every component, network call, and database query will eventually fail.
2.  **Graceful Degradation**: When a part breaks, the whole shouldn't. A broken widget is better than a broken page.
3.  **Containment**: Errors must be trapped as close to the source as possible using Error Boundaries.
4.  **Recovery**: Provide clear paths for users to recover (retry, go home, reload).

## Critical Learnings

### 2024-05-22 - [Homepage] Entropy: Search Bar Failure
*   **Failure Mode**: The `SearchSection` on the landing page is a critical interactive component. If it crashes (e.g., due to a runtime error in suggestion logic or a failed network call handled improperly), the error bubbles up to the root `error.tsx`, taking down the entire homepage, including the Hero, Stats, and Features sections. This is a "White Screen of Death" scenario for the landing page.
*   **Resilience Strategy**: Wrap `SearchSection` in a granular `ErrorBoundary` with a lightweight fallback. This ensures that even if the search functionality is unavailable, the marketing content remains visible and accessible.

### 2024-05-24 - [Profile Page] Entropy: Tab Content Failure
*   **Failure Mode**: The `ProfilePage` is a complex client component with multiple sub-sections (Tabs) fetching independent data (Bookmarks, Solved, Strategies). If one sub-component (like `ProfileProblemList`) crashes due to a render error or data corruption, the entire Profile Page crashes, locking the user out of their education and work history settings.
*   **Resilience Strategy**: Wrapped each `TabsContent` child in a granular `ErrorBoundary` with a `ProfileTabErrorFallback` UI using the `fallbackRender` pattern. This ensures that if the "Bookmarks" tab fails, the "Background" and "Strategies" tabs remain fully functional, preventing a complete lockout from the user profile, and provides a "Try Again" retry mechanism.
