# Offline Logbook

## 2025-02-18 - Missing Offline Feedback
**Disconnect:** Users had no visual indication when their network connection dropped.
**Link:** Implemented `OfflineIndicator` and `useOnlineStatus` to provide real-time feedback.

## 2025-02-18 - Missing Service Worker
**Disconnect:** The application had no caching strategy for static assets, causing immediate failure when reloading offline or navigating to cached pages.
**Link:** Implemented Service Worker using `serwist` to cache static assets and provide an offline fallback page.
