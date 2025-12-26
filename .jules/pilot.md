# Pilot's Log: Critical DX/DevOps Learnings

## 2024-05-22 - Missing CI Pipeline
**Discovery:** The repository currently lacks a Continuous Integration (CI) pipeline (missing `.github/workflows` directory). This means tests and linting are not automatically run on pull requests, relying entirely on local pre-commit hooks or manual checks.
**Protocol:** Implement a GitHub Actions workflow to automate linting, type-checking, and testing on every push and pull request. This ensures code quality and prevents regressions in a shared environment.
