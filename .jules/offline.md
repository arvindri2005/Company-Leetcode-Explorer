## 2025-12-29 - Firestore Offline Persistence

### Disconnect:
Previously, the application relied entirely on an active network connection to fetch and display data. If a user lost connectivity:
1.  Reloading the page would result in a blank screen or a generic "You are offline" page without any useful content.
2.  Navigating to previously visited pages (e.g., a Company profile or Problem list) would fail to load data, showing empty states or errors.
3.  Attempts to interact with the app (e.g., bookmarking a problem) would fail immediately.

### Link:
To bridge this gap, we implemented **Firestore Offline Persistence** using `enableMultiTabIndexedDbPersistence`.

### Connectivity Solution:
1.  **Cache:** The Firestore SDK now automatically caches documents read from the database into the browser's IndexedDB.
    *   **Read-while-offline:** If the user goes offline and reloads or navigates to a previously visited page, the SDK serves the data from the local cache instead of failing.
    *   **Write-while-offline:** Write operations (like bookmarking) are queued locally and automatically synchronized with the server when the connection is restored.
2.  **Implementation:** Modified `src/lib/firebase.ts` to enable persistence conditionally (client-side only) and handle potential errors (e.g., multiple tabs open, browser incompatibility).
3.  **Resilience:** Verified that the implementation is robust against server-side rendering (SSR) environments and browser limitations.

### Critical Learning:
*   **Environment Variables & Build:** Enabling persistence revealed a dependency on strict environment variable validation in the build process. To verify offline features in a CI/CD or restricted environment without production secrets, it is essential to mock these variables in the test setup (`jest.setup.ts`) to prevent `src/env.ts` from blocking execution.
*   **Deprecation Warning:** Firestore's `enableMultiTabIndexedDbPersistence` is effectively deprecated in favor of the newer `FirestoreSettings.cache` configuration object, but the current implementation remains functional and is the standard way to enable it for the v9 Modular SDK until a full refactor to the new config pattern is prioritized.
