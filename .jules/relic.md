# 🏺 Relic's Journal

## 2024-05-24: Cleanup of `ts-node`
- **Discovery**: `ts-node` is present in `devDependencies` and `tsconfig.json`, but `package.json` scripts utilize `tsx`.
- **Action**: Removing `ts-node` to standardize on `tsx` and reduce dependencies.
- **Verification**: `tsx` is already the de-facto standard in this repo.

## 2024-05-24: Standardize Error Handling in `ProblemRepository`
- **Discovery**: The `ProblemRepository` was using `catch (error: any)` in multiple places, relying on unsafe property access for fallback logic.
- **Action**: Refactored to use `unknown`, introduced `isFirestoreIndexError` type guard, and standardized logging across optimized/semi-optimized paths.
- **Verification**: Verified via `problem.repository.relic.test.ts` that fallback logic correctly identifies `failed-precondition` errors and triggers the semi-optimized path.

## 2025-05-24: Replace `use-debounce` with Native Hook
- **Discovery**: The external library `use-debounce` was used in a single component (`dashboard-header.tsx`), while other components utilized a local `useDebounce` hook.
- **Action**: Implemented `useDebouncedCallback` within the existing `@/hooks/use-debounce.ts` file and migrated the component to use the local version.
- **Verification**: Added comprehensive unit tests in `src/hooks/__tests__/use-debounce.test.ts` to verify identical behavior and removed the external dependency.
