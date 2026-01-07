## 2024-05-23 - [Unified Env Configuration]
Risk: [Config/Security insight] Scattered `process.env` usage and redundant fallbacks/magic strings created risk of inconsistency and hidden failures. `LOG_LEVEL` was missing from validation.
Protocol: [Safety measure for next time] Always use `src/env.ts` for all environment variables. Audit `process.env` usage periodically. Ensure `LOG_LEVEL` is documented and validated.

## 2024-05-24 - [Strict Config Validation]
Risk: [Config/Security insight] Hardcoded defaults in `src/env.ts` for critical URLs and IDs masked missing environment variables, potentially leading to silent failures or incorrect environments (e.g., using prod AdSense ID in dev).
Protocol: [Safety measure for next time] Remove `.default()` for infrastructure-critical variables (URLs, Keys). Use `optional()` for feature flags. Enforce explicit configuration in `.env`.

## 2025-05-27 - [Secret Leak in Example]
Risk: [Config/Security insight] `NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID` contained a real production ID in `.env.example`, encouraging developers to use production credentials in development.
Protocol: [Safety measure for next time] Regularly scan `.env.example` for value patterns that look like real keys (e.g., `ca-pub-`, `sk_live_`). Use CI checks or pre-commit hooks to validate example files contain only placeholders.

## 2024-05-23 - [Exposed Secret Key (LOGO_API)]
Risk: [Config/Security insight] The `LOGO_API` token is exposed to the client via `next.config.ts` and appended to URLs in `src/lib/utils.ts`. If this is a secret key (as implied by logo.dev docs), it is leaked to all users.
Protocol: [Safety measure for next time] Do not expose API keys to client unless explicitly public. Use a server-side proxy for third-party APIs requiring secret keys.
