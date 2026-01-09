# Forge's Journal

## Critical Discoveries

### 2024-05-22: Weak Date Validation in User Schemas
**Context:** The `WorkExperienceSchema` and `EducationExperienceSchema` in `src/types/user.ts` relied on duplicated and slightly loose regex patterns for date validation.
**Risk:**
- Inconsistent date formats entering the system (e.g., `YYYY` vs `MM/YYYY`).
- Potential for invalid months (e.g., `13/2023`) if the regex wasn't strict enough (though it was mostly correct).
- Maintenance burden due to duplicated logic.
**Fix:** Normalized date validation into a reusable `DateStringSchema` that strictly enforces `YYYY` or `MM/YYYY` formats and validates month ranges using Zod refinements.
