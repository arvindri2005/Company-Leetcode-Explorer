# UI Design & Guidelines

We use **Tailwind CSS** for styling and **Shadcn UI** for reusable components. Our design focuses on a clean, modern aesthetic with support for Dark Mode.

## Design System

### Colors

Our color palette is defined in `tailwind.config.ts` and uses CSS variables for easy theming (e.g., `hsl(var(--primary))`).

- **Primary**: Main brand color (used for buttons, active states).
- **Secondary**: Accents and secondary actions.
- **Destructive**: Error states and delete actions.
- **Muted**: Subtext and disabled states.
- **Background/Foreground**: Base page colors.
- **Card/Popover**: Surface colors for components.

Custom named colors:

- `brand`: Brand specific colors.
- `difficulty`: Colors for problem difficulties (Easy, Medium, Hard).
- `stat`: Dashboard statistic colors.

### Typography

We use modern sans-serif fonts. Headings and body text should follow a consistent scale.

### Components (Shadcn UI)

We utilize Radix UI primitives styled with Tailwind (Shadcn UI).
Components are located in `src/components/ui`.

**Usage**:

```tsx
import { Button } from "@/components/ui/button";

export function MyComponent() {
  return <Button variant="default">Click Me</Button>;
}
```

## UI Best Practices

1. **Responsive Design**: Mobile-first approach using Tailwind's breakpoints (`sm`, `md`, `lg`, `xl`).
2. **Accessibility**: Ensure sufficient contrast and use semantic HTML. Radix primitives handle many logical accessibilities.
3. **Dark Mode**: All components must look good in both light and dark modes. Test efficiently.
4. **Consistency**: Reuse `src/components/ui` components instead of building custom buttons or inputs from scratch.

