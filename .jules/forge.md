# Forge's Journal ⚒️

## 2024-05-24

### 🔍 INSPECT
- **EducationExperienceSchema**: `gpa` field is a loose string. It allows users to enter anything or nothing (which is fine if optional), but if they *do* enter something, it should probably be a number or a specific format (e.g. "3.5", "4.0"). Currently `gpa: z.string().optional().or(z.literal(""))` allows "hello".
- **Validation Gap**: The `EducationExperienceSchema` is likely used in client-side forms and maybe server-side actions (need to verify `user.actions.ts` usage again, I missed it in the first read).
- **WorkExperienceSchema**: `endDate` is a string or empty. It should probably handle "Present" or date formats strictly.
- **CompanySchema**: `website` is optional string. Should be `url()`.
- **LeetCodeProblemSchema**: `slug` is just string.

### ⚒️ SELECT
- **Improvement**: Tighten `EducationExperienceSchema` to validate `gpa`. Or tighten `CompanySchema` website.
- **Decision**: `gpa` is user input. Dirty data is most likely here. If I change `gpa` to strict validation, I prevent users from typing "3.5 GPA" instead of "3.5".

### 🔧 TEMPER
- **Plan**: Update `src/types/user.ts` to improve `EducationExperienceSchema`.
- **Validation**: Regex for GPA (0.00-9.99 or similar).

### ✅ VERIFY
- **Tests**: I need to check if there are tests for this schema.

## 2026-01-02

### 🔍 INSPECT
- **UserProfile**: Found that `UserProfile` was defined only as a TypeScript interface, lacking runtime validation.
- **Risk**: Data entering the system (e.g., from Firestore syncs or API updates) relied solely on type confidence, with no runtime guarantees for email formats or required fields.
- **Timestamp Ambiguity**: Firestore dates often return as `Timestamp` objects, but the interface expected JS `Date`.

### ⚒️ SELECT
- **Improvement**: Replace the `UserProfile` interface with a Zod schema (`UserProfileSchema`).
- **Why**: This creates a "Single Source of Truth" where the TS type is derived from the validator, ensuring the runtime contract matches the compile-time expectations.

### 🔧 TEMPER
- **Implementation**: Created `UserProfileSchema` in `src/types/user.ts` enforcing strict email validation and `Date` types.
- **Validation**: Added a dedicated test suite `src/types/__tests__/user-profile-schema.test.ts` to verify the schema.

### ✅ VERIFY
- **Outcome**: The schema correctly rejects invalid emails and non-Date objects (forcing a transformation layer for Timestamps).
- **Tests**: Passed 5/5 assertions covering happy paths, missing fields, and type mismatches.
