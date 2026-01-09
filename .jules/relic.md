### 🏺 Relic: Modernization Log

#### CRITICAL DISCOVERIES
- **Trapped Dependency**: `SimpleLRUCache` depends on `crypto` (Node.js), making it strictly server-side. Attempts to use it in client components will break the build unless polyfilled.
- **Legacy Pattern**: Found `JSON.parse(JSON.stringify(...))` recursion in `SimpleLRUCache.generateKey`. This was inefficient (O(N*Depth)) and crashed on `undefined` values.
- **Fix**: Replaced with O(N) `sortKeys` recursion + single `JSON.stringify`.

#### LESSONS
- **JSON Stability**: `JSON.stringify` on objects with sorted keys is a reliable way to generate stable cache keys in JS, but requires manual handling of `undefined` if you're building the object manually.
- **Behavior Preservation**: `JSON.stringify` omits `undefined` values. The legacy implementation crashed. Modernizing fixed the crash.
