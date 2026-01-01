## 2024-05-23 - [Unified Env Configuration]
Risk: [Config/Security insight] Scattered `process.env` usage and redundant fallbacks/magic strings created risk of inconsistency and hidden failures. `LOG_LEVEL` was missing from validation.
Protocol: [Safety measure for next time] Always use `src/env.ts` for all environment variables. Audit `process.env` usage periodically. Ensure `LOG_LEVEL` is documented and validated.

## 2024-05-24 - [Strict Config Validation]
Risk: [Config/Security insight] Hardcoded defaults in `src/env.ts` for critical URLs and IDs masked missing environment variables, potentially leading to silent failures or incorrect environments (e.g., using prod AdSense ID in dev).
Protocol: [Safety measure for next time] Remove `.default()` for infrastructure-critical variables (URLs, Keys). Use `optional()` for feature flags. Enforce explicit configuration in `.env`.
