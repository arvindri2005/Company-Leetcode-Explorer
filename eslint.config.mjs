// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import boundaries from "eslint-plugin-boundaries";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unicorn from "eslint-plugin-unicorn";

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
      "public/sw.js",
    ],
  },
  {
    extends: [nextCoreWebVitals],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  // TypeScript strict rules (extends the parser from next config)
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Catch unused variables (allow underscore prefix to ignore)
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      // Warn on explicit any
      "@typescript-eslint/no-explicit-any": "warn",
      // Consistent type imports (use `type` keyword)
      "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      }],
    },
  },

  // Import sorting - auto-organizes imports
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": ["error", {
        groups: [
          // React first
          ["^react", "^react-dom"],
          // Next.js
          ["^next"],
          // External packages
          ["^@?\\w"],
          // Internal aliases (@/)
          ["^@/"],
          // Parent imports
          ["^\\.\\."],
          // Sibling imports
          ["^\\."],
          // Style imports
          ["^.+\\.css$"],
        ],
      }],
      "simple-import-sort/exports": "error",
    },
  },

  // Code quality rules (unicorn)
  {
    plugins: {
      unicorn,
    },
    rules: {
      // Prefer modern array methods
      "unicorn/prefer-array-find": "error",
      "unicorn/prefer-array-flat-map": "error",
      "unicorn/prefer-array-some": "error",
      "unicorn/prefer-includes": "error",
      // Prefer string methods
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/prefer-string-trim-start-end": "error",
      // Error handling
      "unicorn/prefer-type-error": "error",
      // No useless undefined
      "unicorn/no-useless-undefined": "warn",
      // Prefer ternary for simple conditionals
      "unicorn/prefer-ternary": "warn",
      // Filename case (kebab-case for consistency)
      "unicorn/filename-case": ["error", {
        case: "kebabCase",
        ignore: [
          "README.md",
          "CHANGELOG.md",
          "CONTRIBUTING.md",
          "CODE_OF_CONDUCT.md",
          "SECURITY.md",
          "LICENSE",
        ],
      }],
    },
  },

  // General best practices
  {
    rules: {
      // No console.log in production (allow warn/error)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Prefer const over let
      "prefer-const": "error",
      // No var keyword
      "no-var": "error",
      // Require curly braces for all blocks
      "curly": ["error", "all"],
      // Strict equality (=== instead of ==)
      "eqeqeq": ["error", "always"],
      // No nested ternary (hard to read)
      "no-nested-ternary": "error",
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
        {
          type: "domain",
          pattern: "src/domain/**/*",
          capture: ["category"],
        },
        {
          type: "shared",
          pattern: "src/shared/**/*",
          capture: ["category"],
        },
        {
          type: "feature",
          pattern: "src/features/*/**/*",
          capture: ["feature", "category"],
        },
        {
          type: "app",
          pattern: "src/app/**/*",
          capture: ["category"],
        },
        {
          type: "lib",
          pattern: "src/lib/**/*",
          capture: ["category"],
        },
        {
          type: "components",
          pattern: "src/components/**/*",
          capture: ["category"],
        },
        {
          type: "hooks",
          pattern: "src/hooks/**/*",
        },
        {
          type: "providers",
          pattern: "src/providers/**/*",
        },
        {
          type: "services",
          pattern: "src/services/**/*",
        },
        {
          type: "types",
          pattern: "src/types/**/*",
        },
        {
          type: "ai",
                      pattern: "src/lib/ai/**/*",        },
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
            { from: "domain", allow: ["domain", "shared"] },
            { from: "shared", allow: ["shared"] },
            {
              from: "feature",
              allow: ["domain", "shared", "lib", "feature", "types", "constants", "components", "hooks", "app", "ai"],
            },
            {
              from: "app",
              allow: ["domain", "shared", "feature", "lib", "components", "hooks", "providers", "services", "types", "ai", "constants", "app"],
            },
            { from: "lib", allow: ["shared", "lib", "types", "domain", "feature"] },
            { from: "components", allow: ["shared", "lib", "components", "hooks", "types", "constants"] },
            { from: "hooks", allow: ["shared", "lib", "hooks", "types"] },
            { from: "providers", allow: ["shared", "lib", "hooks", "types", "feature", "services"] },
            { from: "services", allow: ["shared", "lib", "types", "domain", "services"] },
            { from: "types", allow: ["types", "shared"] },
            { from: "ai", allow: ["shared", "lib", "types", "domain", "ai", "feature"] },
            { from: "constants", allow: ["constants", "shared"] },
          ],
        },
      ],
      "boundaries/no-private": ["error", { allowUncles: false }],
    },
  },

  // Relaxed rules for test files and stories
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/*.stories.tsx", "**/__tests__/**/*"],
    rules: {
      "boundaries/element-types": "off",
      "boundaries/no-private": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "unicorn/filename-case": "off",
    },
  },

  // Relaxed rules for config files
  {
    files: ["*.config.ts", "*.config.js", "*.config.mjs", "scripts/**/*"],
    rules: {
      "no-console": "off",
      "unicorn/filename-case": "off",
    },
  },
]);
