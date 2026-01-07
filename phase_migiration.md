# Migration to Feature-Based Architecture

## Overview

This plan outlines the migration of the Next.js project from a scattered component structure to a scalable, feature-based architecture. The migration will be executed in **8 sequential phases** to minimize risk and ensure testability at each step.

**Current State:**
- Partial feature organization: `features/auth/`, `features/companies/`, `features/problems/`
- Most components scattered in `components/` (216 files across 16 subdirectories)
- Components: 8 auth, 20 company, 33 problem components outside features
- Path alias: `@/*` → `./src/*`
- Test infrastructure: Jest with co-located tests

**Target State:**
- Full feature-based organization with co-location
- Enhanced path aliases for better imports
- Centralized test directories for e2e/integration
- Clean separation between features and shared components

---

## User Review Required

> [!IMPORTANT]
> **Phased Migration Approach**
> This migration will be done in **8 distinct phases**. Each phase is independently testable and can be committed separately. This approach minimizes risk and allows rollback if issues arise.

> [!WARNING]
> **Breaking Changes to Imports**
> All import paths will be updated across the codebase. This is a large-scale refactor that will touch many files. We will update imports phase-by-phase to ensure each feature works correctly before moving to the next.

> [!CAUTION]
> **Backup Recommended**
> Before starting this migration, ensure your code is committed to git. Each phase will be committed separately so you can rollback if needed.

---

## Proposed Changes

### Phase 1: Foundation & Configuration

#### [MODIFY] [tsconfig.json](file:///d:/After/Byte-to-Offer/tsconfig.json)

Add enhanced path aliases for cleaner imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/providers/*": ["./src/providers/*"],
      "@/services/*": ["./src/services/*"]
    }
  }
}
```

#### [MODIFY] [jest.config.ts](file:///d:/After/Byte-to-Offer/jest.config.ts)

Update module mapper to support new path aliases:

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@/components/(.*)$': '<rootDir>/src/components/$1',
  '^@/features/(.*)$': '<rootDir>/src/features/$1',
  '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
  '^@/types/(.*)$': '<rootDir>/src/types/$1',
  '^@/providers/(.*)$': '<rootDir>/src/providers/$1',
  '^@/services/(.*)$': '<rootDir>/src/services/$1',
}
```

#### [NEW] Directory Structure

Create new directories:
- `src/providers/` - React context providers
- `tests/e2e/` - End-to-end tests (Playwright)
- `tests/integration/` - Integration tests
- `tests/mocks/` - Shared test mocks
- `tests/setup/` - Test configuration

---

### Phase 2: Migrate `features/problems/`

**Goal:** Complete the problems feature with full co-location pattern.

#### Current State
- `features/problems/hooks/` - exists with some hooks
- `components/problem/` - 33 component files (11 with tests, 11 with stories)

#### Changes

##### [NEW] Feature Structure

```
features/problems/
├── components/
│   ├── problem-card/
│   │   ├── problem-card.tsx
│   │   ├── problem-card.test.tsx
│   │   ├── problem-card.stories.tsx
│   │   └── index.ts
│   ├── problem-list/
│   │   ├── problem-list.tsx
│   │   ├── problem-list.test.tsx
│   │   ├── problem-list.stories.tsx
│   │   └── index.ts
│   ├── difficulty-badge/
│   ├── tag-badge/
│   ├── problem-status-icon/
│   ├── problem-info-card/
│   ├── problem-submission-form/
│   ├── problem-list-controls/
│   ├── all-problems-list/
│   ├── ai-tooltip-content/
│   └── index.ts (barrel export)
├── hooks/
│   └── (existing hooks remain)
├── services/
│   └── problems.service.ts (new)
├── types/
│   └── problem.types.ts (new)
├── utils/
│   └── problem-filters.ts (move from lib/)
└── index.ts (feature barrel export)
```

##### Actions
1. Move all 33 components from `components/problem/` to `features/problems/components/`
2. Create subdirectories for each component with co-located tests/stories
3. Create `services/problems.service.ts` for API logic
4. Move problem-related types from `types/` to `features/problems/types/`
5. Move `lib/problem-filters/` to `features/problems/utils/`
6. Create barrel exports at each level
7. Update all imports within the feature to use relative paths
8. Update all external imports to use `@/features/problems`

---

### Phase 3: Migrate `features/companies/`

**Goal:** Complete the companies feature with full co-location pattern.

#### Current State
- `features/companies/api/` - exists
- `features/companies/components/page/` - exists
- `components/company/` - 20 component files

#### Changes

##### [MODIFY] Feature Structure

```
features/companies/
├── components/
│   ├── company-card/
│   │   ├── company-card.tsx
│   │   ├── company-card.test.tsx (new)
│   │   └── index.ts
│   ├── company-list/
│   │   ├── company-list.tsx
│   │   ├── company-list.test.tsx (existing)
│   │   └── index.ts
│   ├── company-header/
│   ├── company-search-bar/
│   ├── company-table/
│   ├── company-submission-form/
│   ├── company-preparation-guide/
│   ├── company-problem-stats/
│   ├── related-companies/
│   ├── page/ (existing - company-page.tsx, company-tabs.tsx, etc.)
│   └── index.ts
├── api/
│   └── (existing files)
├── hooks/
│   └── use-companies.ts (new)
├── services/
│   └── companies.service.ts (new)
├── types/
│   └── company.types.ts (move from global types)
└── index.ts
```

##### Actions
1. Move all 20 components from `components/company/` to `features/companies/components/`
2. Create subdirectories for each component
3. Create missing test files
4. Create `services/companies.service.ts`
5. Move company types to feature
6. Create barrel exports
7. Update imports

---

### Phase 4: Migrate `features/auth/`

**Goal:** Complete the auth feature with full co-location pattern.

#### Current State
- `features/auth/context/` - exists
- `components/auth/` - 8 component files

#### Changes

##### [MODIFY] Feature Structure

```
features/auth/
├── components/
│   ├── login-form/
│   │   ├── login-form.tsx
│   │   ├── login-form.test.tsx (new)
│   │   └── index.ts
│   ├── signup-form/
│   ├── forgot-password-form/
│   ├── reset-password-form/
│   ├── google-auth-button/
│   ├── password-strength-indicator/
│   ├── auth-layout/
│   └── index.ts
├── hooks/
│   └── use-auth.ts (new - from context)
├── services/
│   └── auth.service.ts (new)
├── types/
│   └── auth.types.ts (new)
├── context/ (existing - consider deprecating in favor of providers)
└── index.ts
```

##### Actions
1. Move all 8 components from `components/auth/` to `features/auth/components/`
2. Create subdirectories with co-location
3. Create test files for each component
4. Create `services/auth.service.ts`
5. Extract types to `auth.types.ts`
6. Create custom hook from context
7. Update imports

---

### Phase 5: Extract New Features

**Goal:** Create new features from existing component groups.

#### [NEW] `features/profile/`

Move from `components/profile/` (7 files):

```
features/profile/
├── components/
│   ├── profile-card/
│   ├── profile-settings/
│   ├── strategy-lists-section/
│   └── index.ts
├── hooks/
│   └── use-profile.ts
├── services/
│   └── profile.service.ts
├── types/
│   └── profile.types.ts
└── index.ts
```

#### [NEW] `features/tools/`

Move from `components/tools/` (typing test, etc.):

```
features/tools/
├── typing-test/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── index.ts
└── index.ts
```

#### [NEW] `features/contact/`

Move from `components/contact/` (2 files):

```
features/contact/
├── components/
│   └── contact-form/
├── services/
│   └── contact.service.ts
└── index.ts
```

---

### Phase 6: Reorganize Shared Components

**Goal:** Keep only truly shared, domain-agnostic components in `components/`.

#### [MODIFY] `components/ui/`

Apply co-location pattern to UI primitives:

```
components/ui/
├── button/
│   ├── button.tsx
│   ├── button.test.tsx (new)
│   └── index.ts
├── input/
│   ├── input.tsx
│   ├── input.test.tsx (new)
│   └── index.ts
├── card/
├── dialog/
├── tabs/
│   ├── tabs. tsx
│   ├── tabs.test.tsx (existing)
│   └── index.ts
└── ... (105 UI components - co-locate each)
```

> [!NOTE]
> This will require creating subdirectories for ~105 UI components. We'll do this systematically using a script if needed.

#### [MODIFY] `components/layout/`

```
components/layout/
├── header/
│   ├── header.tsx
│   ├── header.test.tsx (existing)
│   └── index.ts
├── footer/
├── sidebar/
└── index.ts
```

#### Keep As-Is
- `components/seo/` - shared SEO primitives
- `components/skeletons/` - loading skeletons
- `components/icons/` - icon components

---

### Phase 7: Reorganize `lib/` Directory

**Goal:** Better organize global utilities and move feature-specific code to features.

#### [MODIFY] `lib/` Structure

```
lib/
├── api/
│   ├── client.ts (HTTP client setup)
│   ├── interceptors.ts
│   └── index.ts
├── utils/
│   ├── cn.ts (className utility)
│   ├── format-date.ts
│   ├── utils.ts (existing general utils)
│   └── index.ts
├── validations/
│   └── schemas/
│       └── ... (Zod schemas if needed)
├── config/
│   ├── site.config.ts
│   └── env.ts (move from src/env.ts)
├── cache/ (existing)
├── error-handler.ts (existing)
├── logger.ts (existing)
└── lru-cache.ts (existing)
```

#### Actions
- Keep: `cache/`, `error-handler.ts`, `logger.ts`, `lru-cache.ts`, `navigation-registry.ts`
- Move: `problem-filters/` → `features/problems/utils/`
- Move: `typing-game-logic.ts` → `features/tools/typing-test/utils/`
- Move: `src/env.ts` → `lib/config/env.ts`

---

### Phase 8: Create Providers Directory

**Goal:** Centralize React context providers.

#### [NEW] `providers/`

```
providers/
├── theme-provider.tsx (if exists)
├── auth-provider.tsx (from features/auth/context)
├── index.ts
└── README.md (explain provider usage)
```

Move `contexts/` content to `providers/` and update usage in `app/layout.tsx`.

---

## Verification Plan

### Automated Tests

After each phase, run:

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Unit tests
pnpm test

# Build verification
pnpm build
```

**Specific test commands per phase:**

**Phase 2 (Problems):**
```bash
# Run problem-related tests
pnpm test -- components/problem
pnpm test -- features/problems
```

**Phase 3 (Companies):**
```bash
pnpm test -- components/company
pnpm test -- features/companies
```

**Phase 4 (Auth):**
```bash
pnpm test -- components/auth
pnpm test -- features/auth
```

**Phase 6 (Shared Components):**
```bash
pnpm test -- components/ui
pnpm test -- components/layout
```

### Manual Verification

After completing all phases:

1. **Dev Server Test:**
   ```bash
   pnpm dev
   ```
   - Navigate to http://localhost:3000
   - Verify home page loads without errors
   - Check browser console for errors

2. **Feature Testing:**
   - Test login/signup flow (`features/auth`)
   - Browse companies page (`features/companies`)
   - View problems list (`features/problems`)
   - Test typing test tool (`features/tools`)

3. **Build Test:**
   ```bash
   pnpm build
   pnpm start
   ```
   - Verify production build completes
   - Test production app functionality

4. **Storybook Test (Optional):**
   ```bash
   pnpm storybook
   ```
   - Verify all stories load correctly
   - Check that component documentation is intact

### Rollback Plan

Each phase is a separate git commit. If issues arise:
```bash
git revert <commit-hash>
```

Or reset to before migration:
```bash
git reset --hard <commit-before-migration>
```

---

## Migration Timeline

| Phase | Effort | Can Auto-Run |
|-------|--------|--------------|
| Phase 1: Foundation | Low | ✅ Yes |
| Phase 2: Problems | Medium | ⚠️ Needs review |
| Phase 3: Companies | Medium | ⚠️ Needs review |
| Phase 4: Auth | Medium | ⚠️ Needs review |
| Phase 5: New Features | Medium | ⚠️ Needs review |
| Phase 6: Shared Components | High | ❌ Manual recommended |
| Phase 7: Lib Reorganization | Low | ✅ Yes |
| Phase 8: Providers | Low | ✅ Yes |

**Total Estimated Time:** 4-6 hours (manual) or phased over multiple sessions

---

## Questions for User

1. **Migration Approach:** Would you prefer to migrate all phases at once, or phase-by-phase with review at each step?
2. **Testing:** Do you have any e2e tests (Playwright/Cypress) that I should be aware of?
3. **CI/CD:** Are there any CI/CD pipelines that might be affected by this migration?
4. **Priority Features:** Which feature should we migrate first if doing phased migration? (Recommendation: Start with `problems` since it's most complete)
