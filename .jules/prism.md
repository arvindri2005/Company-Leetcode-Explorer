# Prism Journal 🌈

## Critical Discoveries

### Visual Drift in Typing Test Tooltip
**Date:** 2024-05-24
**File:** `src/components/tools/typing-test/typing-results.tsx`

I found hardcoded inline styles in the `Recharts` Tooltip component:
```tsx
contentStyle={{ 
    backgroundColor: 'hsl(var(--popover))', 
    borderColor: 'hsl(var(--border))', 
    borderRadius: '12px',
    padding: '8px 12px',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' 
}}
```

**Issues:**
1.  **Hardcoded Hex/Values:** `padding: '8px 12px'` is a magic number. `borderRadius: '12px'` is also hardcoded.
2.  **Hardcoded Shadow:** `boxShadow` uses a specific RGBA value not present in the design tokens.
3.  **Inline Styles:** Bypasses Tailwind's utility class system.

**Resolution:**
Refactor to use a custom `content` component for the Tooltip, applying standard Tailwind classes (`bg-popover`, `rounded-xl`, `px-3`, `py-2`, `shadow-xl`) to align with the design system.
