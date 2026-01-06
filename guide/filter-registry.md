# Problem Filter Registry

The `ProblemFilterRegistry` handles the complex filtering logic for LeetCode problems, allowing a seamless combination of Firestore query constraints (for performance) and in-memory filtering (for flexibility).

## 🧠 Why a Registry?

Filtering logic can get complex, especially when dealing with:
1.  **Database Constraints**: Some filters can be applied directly to the Firestore query (e.g., `where("difficulty", "==", "Easy")`).
2.  **In-Memory Logic**: Some filters rely on computed fields or logic too complex for NoSQL queries (e.g., specific array intersections or context-dependent checks).
3.  **Hybrid Approaches**: We often want to filter as much as possible at the database level, then refine the results in memory.

The Registry Pattern decouples the *definition* of a filter from its *execution*, making it easy to add new filter types without modifying the core service logic.

## 📂 Structure

The filter logic is located in `src/lib/problem-filters/`.

-   `types.ts`: Defines the `ProblemFilter<T>` interface.
-   `implementations.ts`: Contains the concrete filter classes (e.g., `DifficultyFilterImplementation`).
-   `registry.ts`: The singleton registry that manages active filters.

## 🛠️ The `ProblemFilter` Interface

Every filter must implement the `ProblemFilter<T>` interface, where `T` is the type of the filter value (e.g., `string[]` for a list of difficulties).

```typescript
export interface ProblemFilter<T = unknown> {
  // Unique key used in the URL query params or API payload (e.g., "difficulty")
  key: string;

  // 1. Database Level: Returns Firestore constraints to narrow down the fetch.
  // Return [] if this filter cannot be applied at the DB level.
  getConstraints(value: T, companyId: string): QueryConstraint[];

  // 2. Memory Level: Returns true if the problem matches the filter.
  // Used for post-fetch refinement or when DB filtering isn't enough.
  matches(problem: ProblemSummaryDTO, value: T, companyId: string): boolean;

  // 3. Validation: Type guard to ensure runtime values match expected type T.
  isValidValue(value: unknown): value is T;
}
```

## 🚀 How to Add a New Filter

To add a new filter (e.g., filtering by "Status" like Solved/Todo):

1.  **Define the Class**: Create a new class in `implementations.ts` implementing `ProblemFilter`.
2.  **Implement Logic**:
    *   `getConstraints`: Add Firestore `where` clauses if possible.
    *   `matches`: Add the JS logic to check the problem object.
    *   `isValidValue`: Validate the input.
3.  **Register**: Add it to the registry instance.

### Example: Status Filter

```typescript
// src/lib/problem-filters/implementations.ts

export class StatusFilterImplementation implements ProblemFilter<string[]> {
  key = "status";

  getConstraints(value: string[], companyId: string): QueryConstraint[] {
    // Status is often stored in a subcollection, so we might return []
    // and rely 100% on in-memory filtering after joining data.
    return [];
  }

  matches(problem: ProblemSummaryDTO, value: string[], companyId: string): boolean {
    // Check if the problem's status matches one of the selected values
    return value.includes(problem.status);
  }

  isValidValue(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(s => typeof s === "string");
  }
}
```

## 📦 Usage in Services

The service layer (e.g., `ProblemService`) uses the registry to dynamically build queries.

```typescript
// 1. Get DB Constraints
const dbConstraints = problemFilterRegistry.getConstraints(filters, companyId);
const q = query(collection(db, "problems"), ...dbConstraints);
const snapshot = await getDocs(q);

// 2. Fetch Data & Map
const problems = snapshot.docs.map(mapDocToProblem);

// 3. Refine in Memory
const finalResults = problemFilterRegistry.filterInMemory(problems, filters, companyId);
```

## ⚠️ Best Practices

*   **Canonicalize Keys**: Ensure filter keys match the URL query parameters exactly.
*   **Handle Empty Values**: Always handle `null`, `undefined`, or empty arrays gracefully (usually by returning `[]` or `true`).
*   **Performance**: Put the most restrictive filters in `getConstraints` to minimize the number of documents read from Firestore.
