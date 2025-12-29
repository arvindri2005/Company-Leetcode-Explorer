# Form's Ledger - Critical Input/Validation Learnings

## 2025-05-23 - Fix Autocomplete in Auth Flows
**Input:** Missing `autoComplete` attributes on auth forms caused friction for password managers and manual typing.
**Output:** Added standard `autoComplete` attributes (`email`, `current-password`, `new-password`, `name`) to Login, Signup, Forgot Password, and Reset Password forms to enable browser autofill and password manager integration.

## 2024-05-24 - Optimizing Mobile Input and Autocomplete
**Input:** Mobile users face friction when entering numeric data (Year, GPA) into text fields, requiring keyboard switching. Standard professional fields (Company, Job Title) lack autocomplete hints.
**Output:** Applied `inputMode="numeric"` and `inputMode="decimal"` to relevant fields to trigger appropriate soft keyboards. Added `autoComplete="organization"` and `autoComplete="organization-title"` to leverage browser autofill for professional history.

## 2025-05-26 - URL Input Optimization
**Input:** Company submission forms requested URLs (Website, Logo) using standard text inputs, failing to trigger the URL-optimized keyboard on mobile (missing `.com` key) and preventing browser autofill.
**Output:** Implemented `type="url"`, `inputMode="url"`, and `autoComplete="url"` on all URL fields to ensure the correct mobile keyboard layout and enable standard browser autocomplete.
