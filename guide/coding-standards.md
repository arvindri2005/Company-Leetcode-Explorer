# Coding Standards & Best Practices

This document outlines the standards for writing code in our codebase, including naming conventions and commenting guidelines.

## 1. Naming Conventions

We enforce strict conventions to ensure consistency and avoid case-sensitivity issues across OS environments (Windows/Linux).

### File System
- **Files:** kebab-case (e.g., `user-profile.tsx`, `api-utils.ts`)
- **Directories:** kebab-case (e.g., `components/auth-flow/`)

#### Next.js Specifics
- **Route Groups:** (kebab-case)
- **Dynamic Params:** [kebab-case]

### Code Identifiers

#### React Components
- PascalCase
- Component name should roughly match the filename (e.g., `user-card.tsx` exports `UserCard`).

#### Functions & Methods
- camelCase (e.g., `getCompanyDetails`)

#### Server Actions
- verb-noun pattern (e.g., `submitForm`, `deleteUser`)

#### Variables
- camelCase (e.g., `userData`)

#### Booleans
- Must use prefixes: `is`, `has`, `should`, `can` (e.g., `isLoading`, `hasPermission`).

#### Constants
- UPPER_SNAKE_CASE (e.g., `DEFAULT_PAGE_SIZE = 20`)

#### Types & Interfaces
- PascalCase (e.g., `CompanyProps`, `UserResponse`)
- Do not use `I` prefix (e.g., `IUser` is forbidden).

## 2. General Best Practices

### Imports
Use absolute imports `@/`:
```ts
import { Button } from "@/components/ui/button";
```

## 3. Commenting Guidelines

The goal is to maintain clean, readable, and maintainable code.

### Core Philosophy

> "Code tells you how; Comments tell you why."

1.  **Code as the primary source of truth**: 
    -   Strive for **self-documenting code** first. Meaningful variable names, function names, and clear logic are superior to comments explaining what the code does.
    -   *Avoid*: `// Increment count by 1 \n count++`
    -   *Prefer*: `totalProcessedItems++`

2.  **Explain the "Why" and "Context"**:
    -   Use comments to explain **business logic**, **complex decisions**, **quirks**, or **workarounds** that aren't immediately obvious from the code itself.
    -   *Example*: `// Using a set timeout here to allow the DOM to reflow before calculating dimensions.`

### Types of Comments

#### 1. Documentation Comments (JSDoc / TSDoc)

Use **TSDoc** syntax (`/** ... */`) for all exported functions, classes, interfaces, and types. This enables IDE hover support and auto-generated documentation.

**Requirements**:
-   **Description**: A clear summary of what the symbol does.
-   **@params**: Explain each parameter, especially edge cases or optional values.
-   **@returns**: Describe the return value.
-   **@throws**: List potential errors thrown.

**Example**:

```typescript
/**
 * Calculates the total cost of items in the cart, applying valid discounts.
 * 
 * @param cartItems - Array of items currently in the user's cart.
 * @param discountCode - (Optional) A valid discount code string.
 * @returns The final calculated total price in cents.
 * @throws {InvalidDiscountError} If the provided discount code is expired or malformed.
 */
export function calculateTotal(cartItems: CartItem[], discountCode?: string): number {
  // ...
}
```

#### 2. Inline Comments

Use `//` for inline comments to explain specific lines or blocks of complex code.

-   **Place above the code**: Place comments on the line *before* the code they refer to, indented to match the code.
-   **Keep it brief**: If you need a paragraph, consider if the code can be refactored or extracted into a helper function.

**Example**:

```typescript
// We need to clone the object because the library mutates the input in places
const safePayload = JSON.parse(JSON.stringify(payload)); 
process(safePayload);
```

#### 3. TODO Comments

Use `TODO` comments to mark areas that need future attention.

**Format**: `// TODO(username): Description of what needs to be done`

-   **Include an owner**: Ideally, put your username or the person responsible.
-   **Be specific**: Don't just say `// Fix this`. Say `// TODO(jdoe): Handle edge case where user has no email address`.

**Example**:

```typescript
// TODO(arvind): Refactor this to use the new useAuth hook once it's merged.
const user = await getCurrentUser();
```

### Anti-Patterns (What to Avoid)

1.  **Commented-Out Code**:
    -   **DO NOT** commit commented-out code. It adds noise and rots quickly. Use Git history if you need to retrieve old code.
    
2.  **Redundant Comments**:
    -   Avoiding stating the obvious.
    -   *Bad*: `return true; // returns true`

3.  **Journal Comments**:
    -   Don't leave "Who modified this and when" comments. Git blame handles this.
    -   *Bad*: `// Edits by John on Dec 12th: Fixed bug`

4.  **Closing Brace Comments**:
    -   Modern IDEs highlight matching braces; comments like `// end of if` are unnecessary clutter.

### Special Tags

-   `NOTE`: Non-critical information or context.
-   `WARNING`: Critical drawbacks or side effects.
-   `HACK`: A workaround for a known issue (explain *why* it's necessary).
-   `FIXME`: Broken code that needs immediate fixing.
