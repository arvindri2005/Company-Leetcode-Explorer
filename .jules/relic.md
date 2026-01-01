# 🏺 Relic's Journal

## 2024-05-24: Cleanup of `ts-node`
- **Discovery**: `ts-node` is present in `devDependencies` and `tsconfig.json`, but `package.json` scripts utilize `tsx`.
- **Action**: Removing `ts-node` to standardize on `tsx` and reduce dependencies.
- **Verification**: `tsx` is already the de-facto standard in this repo.

## 2024-05-24: Standardize Error Handling in `ProblemRepository`
- **Discovery**: The `ProblemRepository` was using `catch (error: any)` in multiple places, relying on unsafe property access for fallback logic.
- **Action**: Refactored to use `unknown`, introduced `isFirestoreIndexError` type guard, and standardized logging across optimized/semi-optimized paths.
- **Verification**: Verified via `problem.repository.relic.test.ts` that fallback logic correctly identifies `failed-precondition` errors and triggers the semi-optimized path.
