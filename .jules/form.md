# Form's Ledger - Critical Input/Validation Learnings

## 2025-05-23 - Fix Autocomplete in Auth Flows
**Input:** Missing `autoComplete` attributes on auth forms caused friction for password managers and manual typing.
**Output:** Added standard `autoComplete` attributes (`email`, `current-password`, `new-password`, `name`) to Login, Signup, Forgot Password, and Reset Password forms to enable browser autofill and password manager integration.
