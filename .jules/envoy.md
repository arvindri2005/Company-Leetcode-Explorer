## 2024-05-25 - LOGO_API Manual Exposure
Risk: The `LOGO_API` variable is exposed to the client bundle via `next.config.ts`'s `env` property, even though it lacks the `NEXT_PUBLIC_` prefix.
Protocol: This manual exposure is intentional to inject the token into the client build. However, developers must be aware that `LOGO_API` is *publicly visible* in the browser source code. We've added a strict Zod refinement in `src/env.ts` to ensure this variable is a token (e.g. for `logo.dev`) and never a full URL, preventing accidental leaks of other secrets if the variable were misused.

## 2024-05-25 - Global ProcessEnv Typing
Risk: Direct usage of `process.env` (e.g., in scripts or config files) lacked type safety, increasing the risk of typos or using undefined variables.
Protocol: We implemented `src/types/env.d.ts` which augments `NodeJS.ProcessEnv` with the types inferred from our Zod schemas in `src/env.ts`. This provides IntelliSense and type checking for `process.env` usage across the codebase, ensuring alignment with our defined configuration.
