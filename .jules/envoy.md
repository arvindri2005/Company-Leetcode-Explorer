## 2024-05-23 - [Unified Env Configuration]
Risk: [Config/Security insight] Scattered `process.env` usage and redundant fallbacks/magic strings created risk of inconsistency and hidden failures. `LOG_LEVEL` was missing from validation.
Protocol: [Safety measure for next time] Always use `src/env.ts` for all environment variables. Audit `process.env` usage periodically. Ensure `LOG_LEVEL` is documented and validated.
