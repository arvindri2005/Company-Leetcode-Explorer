# Prism Journal 🌈

## 2024-05-22: Auth Scale Consistency
**Discovery:**
The authentication forms (`login`, `signup`, `reset-password`, `forgot-password`) and the typing test results page were all using a hardcoded `hover:scale-[1.02]` interaction style. This was a "magic number" that was duplicated across multiple files.

**Refraction:**
-   Introduced `scale-102` token in `tailwind.config.js`.
-   Standardized all 5 occurrences to use the new token.
-   This ensures that if we decide to change the "subtle lift" effect later (e.g. to 1.03), we can do it in one place.

**Verification:**
-   Build passed successfully.
-   Grep confirmed no remaining `hover:scale-[1.02]` instances.
