# Coding Conventions

## TypeScript

- Use strict mode (enabled in tsconfig.json)
- Prefer `interface` for object shapes, `type` for unions/intersections
- Export types from feature `index.ts` files
- Use Zod for runtime validation schemas

## React Components

- Use functional components with TypeScript
- Prefer named exports over default exports
- Use `"use client"` directive only when needed (client interactivity)
- Server Components are the default in App Router

```tsx
// Good: Named export with typed props
interface ButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function Button({ variant = "primary", children }: ButtonProps) {
  return <button className={cn(variants[variant])}>{children}</button>;
}
```

## File Naming

- Components: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- Hooks: `use-{name}.ts` (e.g., `use-auth.ts`)
- Types: `{name}.ts` or in feature `types/index.ts`
- Tests: `{name}.test.ts` or `{name}.test.tsx`
- Stories: `{name}.stories.tsx`

## Imports

- Use path aliases (`@/`) instead of relative paths
- Group imports: React → External libs → Internal modules → Types → Styles
- Use barrel exports from features and components

```tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/features/auth";
import type { User } from "@/types";
```

## Styling

- Use Tailwind CSS utility classes
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Follow shadcn/ui patterns for component variants
- Use CSS variables for theming (defined in globals.css)

## Error Handling

- Use try/catch in async functions
- Return typed error responses from services
- Use Error Boundaries for component error handling
- Log errors appropriately (avoid exposing sensitive data)

## Comments

- Use JSDoc for public functions and hooks
- Avoid obvious comments; code should be self-documenting
- Mark deprecated code with `@deprecated` JSDoc tag
