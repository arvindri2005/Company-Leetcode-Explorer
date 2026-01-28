# Testing Guidelines

This document outlines the testing strategies and patterns to ensure code quality and prevent regressions in our codebase.

## 1. Testing Philosophy

We believe in the **Testing Trophy** approach:
1.  **Static Analysis** (TypeScript, ESLint) - *Caught at build time.*
2.  **Unit Tests** (Jest) - *Test individual functions and logic.*
3.  **Integration/Component Tests** (React Testing Library) - *Test how components interact.*
4.  **E2E Tests** (Optional/Future) - *Test the full user flow.*

**Key Principle**: "Write tests that give you confidence, not just coverage."

## 2. Tools & Stack

*   **Runner**: [Jest](https://jestjs.io/)
*   **Component Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
*   **Environment**: `jsdom` (simulates browser environment)

### 3. Unit Testing

Unit tests focus on isolated business logic, typically found in `src/features/*/services`, `src/shared/utils`, or `src/lib`.

### Naming Convention
*   Place test files next to the file being tested.
*   Format: `filename.test.ts` or `filename.test.tsx`.

### Example: Testing a Utility Function

**`src/lib/math.ts`**
```typescript
export const add = (a: number, b: number) => a + b;
```

**`src/lib/math.test.ts`**
```typescript
import { add } from './math';

describe('Math Utils', () => {
  it('should correctly add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
  });
});
```

## 4. Component Testing

Component tests verify that your UI renders correctly and responds to user interactions. We focus on **behavior**, not implementation details.

### Best Practices (React Testing Library)
*   **Query by Accessibility**: Use `getByRole`, `getByLabelText`, `getByText` (in that order). Avoid `getByTestId` unless necessary.
*   **User Events**: Use `@testing-library/user-event` (if available) for more realistic interactions than `fireEvent`.

### Example: Testing a Button Component

**`src/components/ui/custom-button.tsx`**
```typescript
export function CustomButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick}>{label}</button>;
}
```

**`src/components/ui/custom-button.test.tsx`**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomButton } from './custom-button';

describe('CustomButton', () => {
  it('renders with the correct label', () => {
    render(<CustomButton label="Click Me" onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<CustomButton label="Click Me" onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 5. Mocking

### Mocking External Modules
Sometimes you need to mock external libraries or services (like data fetching).

```typescript
import { getProblemService } from '@/lib/di/registrations';

// Example of mocking a dependency
jest.mock('@/lib/di/registrations', () => ({
  getProblemService: jest.fn().mockReturnValue({
    getProblemDetails: jest.fn().mockResolvedValue({ id: '1', title: 'Test Problem' })
  })
}));

test('fetches data successfully', async () => {
  const service = getProblemService();
  const result = await service.getProblemDetails('1');
  expect(result).toEqual({ id: '1', title: 'Test Problem' });
});
```

## 6. Running Tests

*   Run all tests: `npm test`
*   Run in watch mode: `npm test -- --watch`
