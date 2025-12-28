# Form's Ledger - Critical Input/Validation Learnings

## 2025-05-23 - Fix Autocomplete in Auth Flows
**Input:** Missing `autoComplete` attributes on auth forms caused friction for password managers and manual typing.
**Output:** Added standard `autoComplete` attributes (`email`, `current-password`, `new-password`, `name`) to Login, Signup, Forgot Password, and Reset Password forms to enable browser autofill and password manager integration.

## 2024-05-24 - Optimizing Mobile Input and Autocomplete
**Input:** Mobile users face friction when entering numeric data (Year, GPA) into text fields, requiring keyboard switching. Standard professional fields (Company, Job Title) lack autocomplete hints.
**Output:** Applied `inputMode="numeric"` and `inputMode="decimal"` to relevant fields to trigger appropriate soft keyboards. Added `autoComplete="organization"` and `autoComplete="organization-title"` to leverage browser autofill for professional history.

## 2024-05-25 - Mobile Keyboard Optimizations
**Input:** Email inputs on mobile devices were not triggering the optimized keyboard layout (missing '@') despite `type="email"`. Search inputs were missing the 'Search' action key on mobile keyboards.
**Output:** Applied `inputMode="email"` to Signup, Forgot Password, and Contact forms. Applied `inputMode="search"` to the Company Search Bar to ensure optimal mobile keyboard layouts.
