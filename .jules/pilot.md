## 2024-05-23 - Next.js Build Cache Missing
Discovery: The CI pipeline was running `next build` without restoring `.next/cache`. This means every build was starting from scratch, significantly slowing down feedback loops.
Protocol: Added `actions/cache` for `.next/cache` with a key based on lockfile and source files.

## 2024-05-23 - Redundant ESLint Config
Discovery: The project contained both `.eslintrc.json` and `eslint.config.mjs`. Since Next.js and ESLint 9+ prioritize the flat config (`.mjs`), the JSON config was dead code and potentially confusing for developers.
Protocol: Removed `.eslintrc.json` to enforce a single source of truth for linting rules.
