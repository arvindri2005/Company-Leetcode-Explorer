# Cinder's Journal 🪵

## Critical Discoveries

### Unexpectedly Expensive Resources
- **Framer Motion**: Currently included in the main bundle but only used in 4 components (`typing-area.tsx`, `password-strength-indicator.tsx`, `auth-layout.tsx`, `signup-form.tsx`). It adds significantly to the bundle size for relatively simple animations that could likely be achieved with CSS/Tailwind or lighter alternatives.
- **Problem Search (Unbounded Reads)**: The "Semi-Optimized Path" in `ProblemRepository` was performing a full collection scan (fetching all docs) for every search query, filtering in memory. This is a linear cost scaling with DB size, posing a significant risk for read costs and memory bloat.

### Hidden Costs
- (None identified yet)

### Memory/Performance
- **In-Memory Search**: Searching "List" previously fetched all problems (e.g. 3000+) into memory to filter down to ~50. Optimizing this to Firestore range queries reduces the fetch to exactly the 50 matching documents.
