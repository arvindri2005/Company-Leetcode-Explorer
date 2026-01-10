# Component Patterns

## UI Component Structure

Each UI component in `src/components/ui/` follows this structure:

```
components/ui/{component-name}/
├── {component-name}.tsx       # Main component
├── {component-name}.test.tsx  # Unit tests
├── {component-name}.stories.tsx # Storybook stories
└── index.ts                   # Barrel export
```

## shadcn/ui Integration

This project uses shadcn/ui with these conventions:

- Components are in `src/components/ui/`
- Use `cn()` from `@/lib/utils` for class merging
- Follow Radix UI accessibility patterns
- Use CSS variables for theming

```tsx
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}
```

## Form Components

Use react-hook-form with Zod validation:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  // ...
}
```

## Custom Hooks Pattern

```tsx
// hooks/use-{name}.ts
"use client";

import { useState, useEffect } from "react";

export function useCustomHook(param: string) {
  const [state, setState] = useState<Type | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Effect logic
  }, [param]);

  return { state, isLoading, error };
}
```

## Server vs Client Components

- Default to Server Components (no directive needed)
- Add `"use client"` only for:
  - useState, useEffect, useContext usage
  - Event handlers (onClick, onChange, etc.)
  - Browser-only APIs
  - Third-party client libraries

## Accessibility

- Use semantic HTML elements
- Include ARIA attributes where needed
- Ensure keyboard navigation works
- Test with screen readers
- Follow Radix UI accessibility patterns
