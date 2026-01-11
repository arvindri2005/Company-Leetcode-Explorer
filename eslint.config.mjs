// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import boundaries from "eslint-plugin-boundaries";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  // Global ignores for build artifacts and generated files
  {
    ignores: [
      "storybook-static/**",
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "out/**",
      ".swc/**",
      ".genkit/**",
    ],
  },
  {
    extends: [nextCoreWebVitals],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Module boundary enforcement configuration
  {
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        // Domain layer - core business logic, no infrastructure dependencies
        {
          type: "domain",
          pattern: "src/domain/**/*",
          capture: ["category"],
        },
        // Shared kernel - common types and utilities used across features
        {
          type: "shared",
          pattern: "src/shared/**/*",
          capture: ["category"],
        },
        // Feature modules - self-contained domain features
        {
          type: "feature",
          pattern: "src/features/*/**/*",
          capture: ["feature", "category"],
        },
        // Application layer - Next.js pages, actions, and API routes
        {
          type: "app",
          pattern: "src/app/**/*",
          capture: ["category"],
        },
        // Library utilities - DI, API helpers, config
        {
          type: "lib",
          pattern: "src/lib/**/*",
          capture: ["category"],
        },
        // Global components - shared UI components
        {
          type: "components",
          pattern: "src/components/**/*",
          capture: ["category"],
        },
        // Global hooks
        {
          type: "hooks",
          pattern: "src/hooks/**/*",
        },
        // Global providers
        {
          type: "providers",
          pattern: "src/providers/**/*",
        },
        // Global services (legacy, being migrated to features)
        {
          type: "services",
          pattern: "src/services/**/*",
        },
        // Global types
        {
          type: "types",
          pattern: "src/types/**/*",
        },
        // AI module
        {
          type: "ai",
          pattern: "src/ai/**/*",
        },
        // Constants
        {
          type: "constants",
          pattern: "src/constants/**/*",
        },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            // Domain layer: can only import from domain and shared
            // This ensures business logic is isolated from infrastructure
            // CRITICAL: Domain must never import from repositories, services, or infrastructure
            {
              from: "domain",
              allow: ["domain", "shared"],
            },
            // Shared kernel: can only import from itself
            // Prevents circular dependencies and keeps shared code pure
            {
              from: "shared",
              allow: ["shared"],
            },
            // Features: can import from domain, shared, lib, components, hooks, types, constants
            // Features can also use app actions and AI module for now (existing patterns)
            // Note: Cross-feature imports should go through barrel exports only
            {
              from: "feature",
              allow: [
                "domain",
                "shared",
                "lib",
                "feature",
                "types",
                "constants",
                "components", // Features use shared UI components
                "hooks", // Features use global hooks
                "app", // Features may call server actions
                "ai", // Features may use AI flows
              ],
            },
            // App layer: can import from most layers (presentation layer)
            {
              from: "app",
              allow: [
                "domain",
                "shared",
                "feature",
                "lib",
                "components",
                "hooks",
                "providers",
                "services",
                "types",
                "ai",
                "constants",
                "app", // App pages can import from other app modules
              ],
            },
            // Lib: can import from shared, lib, types, domain, and features (for DI registrations)
            {
              from: "lib",
              allow: ["shared", "lib", "types", "domain", "feature"],
            },
            // Components: can import from shared, lib, hooks, types, constants, and other components
            {
              from: "components",
              allow: ["shared", "lib", "components", "hooks", "types", "constants"],
            },
            // Hooks: can import from shared, lib, types, and other hooks
            {
              from: "hooks",
              allow: ["shared", "lib", "hooks", "types"],
            },
            // Providers: can import from shared, lib, hooks, types, features, services
            {
              from: "providers",
              allow: ["shared", "lib", "hooks", "types", "feature", "services"],
            },
            // Services: can import from shared, lib, types, domain, and other services
            {
              from: "services",
              allow: ["shared", "lib", "types", "domain", "services"],
            },
            // Types: can only import from types and shared
            {
              from: "types",
              allow: ["types", "shared"],
            },
            // AI: can import from shared, lib, types, domain, features (for service access)
            {
              from: "ai",
              allow: ["shared", "lib", "types", "domain", "ai", "feature"],
            },
            // Constants: can only import from constants and shared
            {
              from: "constants",
              allow: ["constants", "shared"],
            },
          ],
        },
      ],
      // Prevent features from importing other features' internal files
      "boundaries/no-private": [
        "error",
        {
          allowUncles: false,
        },
      ],
    },
  },
  // Ignore test files and stories from boundary checks
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/*.stories.tsx",
      "**/__tests__/**/*",
    ],
    rules: {
      "boundaries/element-types": "off",
      "boundaries/no-private": "off",
    },
  },
]);
