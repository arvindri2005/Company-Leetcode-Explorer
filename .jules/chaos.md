## 2025-12-26 - [Granular Error Boundaries for Critical Lists]

### Entropy: [Cascading Failure]
The main problems page (`/problems`) was performing data fetching directly in the page component. If the database (Firestore) was unreachable or returned an error during this initial fetch, the entire page would crash, triggering the global `error.tsx` and replacing the entire UI (including navigation) with a generic error screen. This "White Screen of Death" experience is jarring and provides no path forward other than a full refresh.

### Order: [Resilience via Granular Boundaries]
We implemented a **Granular Error Boundary** strategy:
1.  **Isolation**: Moved the risky data fetching logic into a dedicated Server Component `ProblemListContainer`.
2.  **Containment**: Wrapped this container in a `Suspense` boundary (for loading states) and a granular `ErrorBoundary` in the parent Page.
3.  **Fallback**: Created a specific `ProblemListErrorFallback` component that preserves the page layout (Header, Sidebar) and only replaces the list area with a user-friendly error card and a reload button.

This ensures that "A broken widget is better than a broken page", allowing the user to still access other parts of the application (like the Sidebar or Navigation) even if the main list fails to load.
