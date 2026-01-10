# Testing Guidelines

## Test Stack

- **Jest**: Unit tests for utilities, hooks, services
- **Testing Library**: Component testing with React Testing Library
- **Vitest**: Alternative test runner (configured)
- **Storybook**: Visual component testing and documentation

## File Locations

- Unit tests: `src/__tests__/` or colocated `{file}.test.ts`
- Component tests: `src/components/ui/{component}/{component}.test.tsx`
- Feature tests: `src/features/{feature}/__tests__/`
- Stories: `{component}.stories.tsx` colocated with component

## Test Patterns

### Unit Test

```typescript
// src/__tests__/lib/utils.test.ts
import { formatDate } from "@/lib/utils";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const result = formatDate(new Date("2024-01-15"));
    expect(result).toBe("January 15, 2024");
  });
});
```

### Component Test

```tsx
// src/components/ui/button/button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("handles click events", async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Test

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./use-counter";

describe("useCounter", () => {
  it("increments count", () => {
    const { result } = renderHook(() => useCounter());
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });
});
```

## Commands

- `pnpm test` - Run all tests
- `pnpm test:watch` - Watch mode
- `pnpm storybook` - Start Storybook dev server

## Best Practices

- Test behavior, not implementation
- Use `screen.getByRole()` for accessibility-friendly queries
- Mock external dependencies (Firebase, APIs)
- Keep tests focused and independent
- Use factories for test data (`src/__tests__/factories/`)
