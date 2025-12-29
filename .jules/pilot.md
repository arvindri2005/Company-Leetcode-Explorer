## 2024-05-22 - Missing CI Pipeline
**Discovery:** The repository currently lacks a Continuous Integration (CI) pipeline (missing `.github/workflows` directory). This means tests and linting are not automatically run on pull requests, relying entirely on local pre-commit hooks or manual checks.
**Protocol:** Implement a GitHub Actions workflow to automate linting, type-checking, and testing on every push and pull request. This ensures code quality and prevents regressions in a shared environment.

## 2024-05-22 - Broken Storybook Build (Node.js vs Browser)
**Discovery:** `pnpm build-storybook` failed because server-side AI libraries (using `node:perf_hooks`) were being bundled into the client-side Storybook build. This happens when UI components import backend logic, even indirectly via types.
**Protocol:** Configure Storybook's Vite builder to alias/mock backend modules (`@/ai/*`, `genkit`) to a dummy file (`src/__mocks__/ai.ts`). Use a recursive Proxy for library mocks (like Zod) to support method chaining without errors. Add `build-storybook` to CI to catch this early.

## 2025-05-22 - Broken Setup Script
**Discovery:** The `pnpm setup` command was defined in `package.json` pointing to `scripts/setup.mjs`, but the file was missing. This created a significant friction point for new developers onboarding to the project.
**Protocol:** Implemented a robust `scripts/setup.mjs` that automates environment configuration (copying `.env.example`), dependency installation, and git hook setup. Always verify entry points defined in `package.json` actually exist.

## 2025-05-22 - Broken Linting in CI
**Discovery:** The CI Lint step was using `continue-on-error: true` because of 47 existing lint errors (mostly `react/no-unescaped-entities` and `react-hooks/set-state-in-effect`). This meant new lint errors would be ignored, and the "Lint" check was effectively useless. Also identified conflicting ESLint configurations (`.eslintrc.json` vs `eslint.config.mjs`).
**Protocol:**
1. Consolidated ESLint configuration to `eslint.config.mjs` (removing `.eslintrc.json`).
2. Configured specific rules (`react/no-unescaped-entities`, `react-hooks/set-state-in-effect`, `react-compiler/react-compiler`, `react-hooks/purity`) to `warn` instead of `error`.
3. Removed `continue-on-error: true` from CI.
This turns the linter back into a "Gatekeeper" that allows existing debt but blocks *new* errors, following the "Stop the Bleeding" principle.
