# Data Layer & Persistence Guide

This guide documents the patterns and standards used in the Repository Layer (`src/repositories`), which is responsible for all direct interactions with Firestore.

## 1. Repository Pattern Overview

We use the Repository Pattern to decouple business logic (Services) from data access details (Firestore).

*   **Responsibility**: CRUD operations, complex querying, and data mapping.
*   **Interface**: Repositories should return typed domain objects (e.g., `Company`, `LeetCodeProblem`), not raw Firestore snapshots.
*   **Error Handling**: Repositories catch database errors, log them via `Logger`, and return safe fallback values or re-throw specific application errors.

## 2. "Validate at the Edge" Pattern

We do not trust database content blindly. All data retrieved from Firestore is validated against Zod schemas before being returned to the application. This prevents "poisoned" data from crashing the UI.

### Implementation
Inside `mapFirestoreDocToX` helper functions, use Zod's `safeParse`.

```typescript
function mapFirestoreDocToCompany(docSnap: DocumentSnapshot): Company {
  const data = docSnap.data()!;
  // ... manual mapping ...
  const company = { ... };

  // VALIDATE
  const result = CompanySchema.safeParse(company);
  if (!result.success) {
    // Log warning but DO NOT crash. Return the "best effort" data.
    Logger.warn(`Data integrity issue: ${result.error.message}`);
  }

  return company;
}
```

## 3. Firestore Type Safety

To prevent runtime errors with Firestore queries, we enforce strict typing for query constraints.

### Rule
Always explicitly type arrays of constraints as `QueryConstraint[]`.

**Bad:**
```typescript
const constraints = []; // Infered as any[] or never[]
constraints.push(where("active", "==", true));
```

**Good:**
```typescript
import { QueryConstraint } from "firebase/firestore";

const constraints: QueryConstraint[] = [];
constraints.push(where("active", "==", true));
```

## 4. Pagination Strategies

The application supports two pagination strategies, often within the same repository to support different UI needs.

### A. Cursor-Based (Infinite Scroll)
*   **Use Case**: "Load More" lists (e.g., Mobile feeds).
*   **Mechanism**: Uses `startAfter(lastDocument)` or `startAfter(cursorId)`.
*   **Pros**: Efficient for deep pagination.
*   **Cons**: Hard to jump to a specific page.

### B. Offset-Based / Page-Based (Standard)
*   **Use Case**: SEO-friendly lists with "Page 1, 2, 3" links.
*   **Mechanism**: Uses `limit(page * pageSize)` and slices the result array in memory (or uses `limit` + `offset` if supported/cost-effective).
*   **Optimization**: 
    *   **Optimized Path**: If filters allow, we fetch only the needed window.
    *   **Semi-Optimized Path**: For complex filters (e.g., in-memory search), we may fetch a larger set (e.g., limit 200) and slice in memory.

## 5. Persistence Best Practices

*   **Dates**: Firestore `Timestamp` objects must be converted to native JS `Date` objects in the mapper.
*   **Slugs**: We prefer using `slug` as the document ID where possible for readable URLs, but always store it as a field too.
*   **Arrays**: Use `array-contains` for tag filtering.
