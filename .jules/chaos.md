## 2025-12-26 - [Granular Error Boundaries for Critical Lists]

### Entropy: [Cascading Failure]
The main problems page (`/problems`) was performing data fetching directly in the page component. If the database (Firestore) was unreachable or returned an error during this initial fetch, the entire page would crash, triggering the global `error.tsx` and replacing the entire UI (including navigation) with a generic error screen. This "White Screen of Death" experience is jarring and provides no path forward other than a full refresh.

### Order: [Resilience via Granular Boundaries]
We implemented a **Granular Error Boundary** strategy:
1.  **Isolation**: Moved the risky data fetching logic into a dedicated Server Component `ProblemListContainer`.
2.  **Containment**: Wrapped this container in a `Suspense` boundary (for loading states) and a granular `ErrorBoundary` in the parent Page.
3.  **Fallback**: Created a specific `ProblemListErrorFallback` component that preserves the page layout (Header, Sidebar) and only replaces the list area with a user-friendly error card and a reload button.

This ensures that "A broken widget is better than a broken page", allowing the user to still access other parts of the application (like the Sidebar or Navigation) even if the main list fails to load.

## 2025-12-28 - [Fault Isolation for Companies Page]

### Entropy: [Page-Level Crash on Data Failure]
Similar to the problems page, the companies directory (`/companies`) performed data fetching at the top level of the Page component. A failure in `companyService.getCompanies` (e.g., Firestore downtime) would cause the entire page to throw, removing the navigation bar and footer and rendering a generic error page.

### Order: [Container-Presentational Pattern with Boundaries]
We applied the **Container-Presentational Pattern** combined with Error Boundaries:
1.  **Refactoring**: Extracted data fetching into `CompaniesListContainer`.
2.  **Protection**: Wrapped the container with `ErrorBoundary` and `Suspense` in the main `CompaniesPage`.
3.  **UX Continuity**: Implemented `CompanyListErrorFallback` to show a localized error message while keeping the site shell (Header/Footer) intact.

This standardization ensures that critical list views degrade gracefully, allowing users to navigate away even if the specific content fails to load.
