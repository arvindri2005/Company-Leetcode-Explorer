## 2024-05-24 - [Broken Type Checks]
Friction: `pnpm typecheck` was failing consistently due to missing `acceptanceRate` in `LeetCodeProblem` type and missing `@testing-library/user-event` dependency.
Service: Added `acceptanceRate` to `LeetCodeProblem` interface and installed `@testing-library/user-event`. This unblocked the type checking process.

## 2024-05-24 - [Database Backup Friction]
Friction: Developers had to manually run `tsx scripts/backup-firestore.ts` with no easy reference to the script path.
Service: Added `db:backup` and `db:restore` scripts to `package.json` to standardize database maintenance operations.

## 2024-05-24 - [Unified Dev Server]
Friction: Developers need to run two separate commands (`dev` and `genkit:dev`) in separate terminals to work on AI features.
Service: Added `dev:all` script using `concurrently` to run both servers in parallel with one command.

## 2025-05-27 - [Slow Pre-commit Hook]
Friction: The pre-commit hook was running `pnpm test`, which executes the entire test suite on every commit. This takes ~14s currently and will only get slower, discouraging frequent commits.
Service: Updated `lint-staged` configuration to run `jest --findRelatedTests` only on changed files and removed the global `pnpm test` from the pre-commit hook.

## 2026-01-02 - [Slow Validation Script]
Friction: `pnpm validate` ran validation steps (typecheck, lint, test) sequentially, causing a long feedback loop (30s+ if all fail) and hiding downstream failures if an upstream check failed early.
Service: Updated `validate` script to use `concurrently` to run typecheck, lint, and tests in parallel. This reduces total execution time to the duration of the longest task (~18s) and provides complete feedback on all checks simultaneously.
