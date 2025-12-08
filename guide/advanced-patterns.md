# Advanced Patterns & Architecture

This guide covers architectural patterns and techniques to ensure the codebase remains maintainable, testable, and robust as it scales.

## 1. Composition over Inheritance

React is built on composition. Avoid deep inheritance hierarchies or creating "Super Components" that do everything.

### Pattern: Compound Components
Instead of a single component with 20 props, use Compound Components for flexibility.

**Bad:**
```tsx
<Modal 
  title="Hello" 
  content="World" 
  footerButton="Close" 
  onClose={close} 
/>
```

**Good:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Hello</DialogTitle>
    </DialogHeader>
    <p>World</p>
    <DialogFooter>
      <Button onClick={close}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## 2. Dependency Injection (in Services)

To make logic testable and decoupled, avoid hardcoding dependencies inside your business logic classes/functions.

**Example**:
Instead of importing the database client directly into a deep function, pass it as a dependency or use the **Repository Pattern** defined in `project-structure.md`.

## 3. SOLID Principles in React

*   **Single Responsibility**: A component should ideally do one thing (e.g., *only* display a user card, not fetch data AND format date AND display).
*   **Open/Closed**: Components should be open for extension but closed for modification. (Use props/children to extend behavior without rewriting the component).

## 4. Error Handling Strategy

### Server Actions
Always use a standardized return type for Server Actions to handle success/error states gracefully in the UI.

```typescript
type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export async function submitData(formData: FormData): Promise<ActionResponse<string>> {
  try {
    // ... logic
    return { success: true, data: "ID_123" };
  } catch (e) {
    return { success: false, error: "Validation failed" };
  }
}
```

### Global Error Barriers
Use `error.tsx` in Next.js route segments to catch unexpected runtime errors and display a fallback UI without crashing the entire app.

## 5. Barrel Files (Index files)

Use `index.ts` files to export public members of a module. This creates a clean public API for other parts of the app.

**Structure**:
`src/components/ui/index.ts` -> `export * from './button'; export * from './input';`

**Import**:
`import { Button, Input } from '@/components/ui';`
