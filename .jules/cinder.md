# Cinder's Journal: Resource Efficiency & Optimizations

## 🪵 Client-Side Caching for AI Problems
**Date:** [Current Date]
**Component:** `AIGroupingSection`
**Impact:** Prevents redundant fetching of 200+ problem objects when switching tabs.

### Discovery
The `AIGroupingSection` component is dynamically loaded inside a `TabsContent` component (Radix UI). By default, switching tabs unmounts the inactive content. This caused `AIGroupingSection` to mount and run its `useEffect` data fetch every time the user returned to the "AI Groups" tab. This resulted in wasted network bandwidth and unnecessary JSON parsing on the client.

### Optimization
Implemented a custom hook `useCompanyAIProblems` with a **module-level cache** (using a simple `Map`).
- **Mechanism:** The hook checks the in-memory `Map` before initiating a network request.
- **Persistence:** Since the module is loaded once per session (SPA navigation), the cache persists even when the component unmounts and remounts.
- **Result:** Data is fetched only once per company per session. Subsequent tab switches are instant and trigger zero network requests.

### Verification
- **Unit Test:** Confirmed that `fetch` is called only once for the same `companyId` across multiple hook instantiations.
- **Efficiency:** Saved ~20KB (gzip) payload per tab switch per company.
