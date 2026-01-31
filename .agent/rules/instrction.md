---
trigger: always_on
---

# AI Instructions & Guidelines

This file serves as the master directive for how to write or modify code.

## 📂 Project Structure & File Organization
**When:** Creating new files, moving files, refactoring, or determining code placement.
**Source:** [`guide/project-structure.md`](guide/project-structure.md)
**Key Rules:**
- **Strictly** follow the Layered Architecture (Presentation -> Service -> Data).
- **Never** put business logic in UI components.
- Adhere to file naming conventions (kebab-case for files, PascalCase for components).

## 💻 Coding Standards
**When:** Writing any React, TypeScript, or JavaScript code.
**Source:** [`guide/coding-standards.md`](guide/coding-standards.md)
**Key Rules:**
- Use **Functional Components** with hooks.
- **Strict TypeScript** usage (avoid `any` at all costs).
- Use `const` for variables; avoid `let` unless necessary.
- Proper error handling (try/catch in async functions).

## 🎨 UI/UX Guidelines
**When:** Styling components, creating pages, or modifying layout.
**Source:** [`guide/ui-guidelines.md`](guide/ui-guidelines.md)
**Key Rules:**
- Use **Tailwind CSS** for styling.
- Follow the defined color palette and typography tokens.
- Ensure **Mobile-First** responsiveness.
- Use the `cn()` utility for class merging.

## 🚀 Performance
**When:** Implementing heavy logic, large lists, data fetching, or optimization tasks.
**Source:** [`guide/performance.md`](guide/performance.md)
**Key Rules:**
- Prioritize **Server Components** (RSC) by default.
- Use `useMemo` and `useCallback` for expensive operations.
- Implement lazy loading for large components (`dynamic` imports).

## 🧪 Testing
**When:** Verifying changes, fixing bugs, or creating new features.
**Source:** [`guide/testing.md`](guide/testing.md)
**Key Rules:**
- Write clear, isolated unit tests.
- Ensure components are testable.

## 🔄 Advanced Patterns
**When:** dealing with complex state, context, or higher-order logic.
**Source:** [`guide/advanced-patterns.md`](guide/advanced-patterns.md)

---
**Summary for AI:**
1. **Check Structure**: Where does this file go? (`project-structure.md`)
2. **Check Style**: How should I name/write this? (`coding-standards.md`)
3. **Check UX**: How should it look? (`ui-guidelines.md`)
4. **Optimize**: Is this performant? (`performance.md`)
