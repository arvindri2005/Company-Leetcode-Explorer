# Pilot's Log: Critical DX/DevOps Learnings

## 2024-05-22 - Missing CI Pipeline
**Discovery:** The repository currently lacks a Continuous Integration (CI) pipeline (missing `.github/workflows` directory). This means tests and linting are not automatically run on pull requests, relying entirely on local pre-commit hooks or manual checks.
**Protocol:** Implement a GitHub Actions workflow to automate linting, type-checking, and testing on every push and pull request. This ensures code quality and prevents regressions in a shared environment.

## 2024-05-22 - Broken Storybook Build (Node.js vs Browser)
**Discovery:** `pnpm build-storybook` failed because server-side AI libraries (using `node:perf_hooks`) were being bundled into the client-side Storybook build. This happens when UI components import backend logic, even indirectly via types.
**Protocol:** Configure Storybook's Vite builder to alias/mock backend modules (`@/ai/*`, `genkit`) to a dummy file (`src/__mocks__/ai.ts`). Use a recursive Proxy for library mocks (like Zod) to support method chaining without errors. Add `build-storybook` to CI to catch this early.

## 2025-05-22 - Broken Setup Script
**Discovery:** The `pnpm setup` command was defined in `package.json` pointing to `scripts/setup.mjs`, but the file was missing. This created a significant friction point for new developers onboarding to the project.
**Protocol:** Implemented a robust `scripts/setup.mjs` that automates environment configuration (copying `.env.example`), dependency installation, and git hook setup. Always verify entry points defined in `package.json` actually exist.
