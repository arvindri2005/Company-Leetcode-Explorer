# STRICT'S RULEBOOK

This file documents critical type system learnings and architectural constraints.
Only add entries for non-obvious patterns, conflicts, or necessary compromises.

## Format
## YYYY-MM-DD - [Title]
**Constraint:** [Type challenge]
**Solution:** [Pattern used]

## 2024-05-24 - Typing Navigation and Toasts in Libraries
**Constraint:** `NavigationRegistry` in `src/lib` needed access to `router` and `toast` methods but couldn't import concrete implementations due to circular dependencies or "use client" context, leading to `any` usage.
**Solution:**
1. Use `AppRouterInstance` from `next/dist/shared/lib/app-router-context.shared-runtime` for type-safe router usage in libraries.
2. Export explicit `ToastFunction` type from `src/hooks/use-toast.ts` to allow consumers to reference the toast interface without importing the runtime hook logic or causing circular dependency issues.
