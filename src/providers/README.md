# Providers

This directory contains all global application providers and context wrappers.

## Purpose

The `providers/` directory centralizes all application-wide state management and configuration providers. These components wrap the application at the root level and provide shared state or functionality to all child components.

## Structure

```
providers/
├── auth-provider.tsx    # Authentication context wrapper
├── theme-provider.tsx   # Theme (dark/light mode) provider
├── index.ts            # Barrel exports for all providers
└── README.md           # This file
```

## Usage

Import providers from the centralized barrel file:

```tsx
import { AuthProvider, ThemeProvider } from '@/providers';
```

## Available Providers

### AuthProvider
Re-exports the authentication provider from `@/features/auth`. Provides user authentication state throughout the application.

**Usage:**
```tsx
import { AuthProvider, useAuth } from '@/providers';

// In layout.tsx
<AuthProvider>
  {children}
</AuthProvider>

// In components
const { user, isAuthenticated } = useAuth();
```

### ThemeProvider
Wraps the `next-themes` library to provide theme switching functionality (light/dark mode).

**Usage:**
```tsx
import { ThemeProvider } from '@/providers';

// In layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
>
  {children}
</ThemeProvider>
```

## Provider Order

The order of providers matters, especially when providers depend on each other. The recommended order in `app/layout.tsx` is:

1. **ThemeProvider** - Should be outermost as it affects visual rendering
2. **AuthProvider** - Authentication state used by many features
3. **Other feature-specific providers** - Any domain-specific context providers

## Best Practices

1. **Keep providers focused**: Each provider should have a single, well-defined responsibility
2. **Avoid prop drilling**: Use providers to share state rather than passing props through many layers
3. **Document dependencies**: If a provider depends on another, document it clearly
4. **Performance**: Use React.memo and selective context updates to prevent unnecessary re-renders
5. **Re-export from features**: When possible, providers should re-export from feature directories to maintain feature isolation

## Migration Notes

This directory was created as part of Phase 8 of the Feature-Based Architecture migration. Previous locations:
- `src/contexts/auth-context.tsx` → `src/providers/auth-provider.tsx`
- `src/components/shared/theme-provider.tsx` → `src/providers/theme-provider.tsx`
