## 2024-05-24 - [Variable Disconnect & Production Defaults]
Risk: [Config/Security insight]
- **The "Ghost Variable" Risk:** The application documentation and `.env.example` referenced `GOOGLE_API_KEY`, but the codebase validated `GEMINI_API_KEY`. Worse, the underlying Genkit library expected `GOOGLE_GENAI_API_KEY` by default. This "Triangle of Confusion" meant that a developer following the documentation would fail to initialize AI features, or rely on hidden environment variables.
- **Production Default Risk:** `NEXT_PUBLIC_APP_URL` defaulted to the production URL (`https://bytetooffer.com`) even in development. This could lead to generated links in local emails or features pointing users to the production site, confusing testers and potentially leaking pre-release data flows to production.

Protocol: [Safety measure for next time]
- **Explicit Binding:** Do not rely on library defaults for critical secrets. Explicitly pass configuration values (e.g., `apiKey: env.VAR_NAME`) to library initialization functions. This ensures the code is the source of truth, not the library's internal documentation.
- **Context-Aware Defaults:** Critical URLs must switch defaults based on `NODE_ENV`. Use `localhost` for development to fail safe (broken link is better than incorrect production link).
- **Single Source of Truth:** `src/env.ts` must be the only place where `process.env` is read. Usage of `process.env` in other files (like `genkit.ts`) should be refactored to import from `@/env`.
