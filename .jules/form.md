# Form's Ledger

## 2025-05-18 - [Accessibility Hooks] **Input:** Server Actions & ARIA **Output:** Manual ID Mapping
**Input:** `useFormState` returns error objects, but standard inputs lack a direct way to associate these server-side errors with client-side ARIA attributes automatically.
**Output:** Must manually construct `id`s for error message containers (e.g., `id="name-error"`) and explicitly bind them using `aria-describedby` and `aria-invalid` on the input, ensuring screen readers announce the error immediately upon focus or submission failure.
