# ✨ Spark Journal

## CRITICAL: Hydration Mismatch Fear

* **The Friction:** Developers constantly have to write boilerplate code (`useEffect` + `useState`) to ensure code only runs on the client. This is driven by a fear of "Hydration Mismatch" errors when using browser-only APIs (`window`, `localStorage`, `Math.random()`).
* **The "Wait, What?":** Reading components cluttered with `isMounted` checks makes it harder to see the actual business logic.
* **The Fix:** `useMounted` hook.
* **Joy Factor:** Reduces 5-6 lines of boilerplate to 1 line. Makes intent ("I need this to be client-only") explicit.
