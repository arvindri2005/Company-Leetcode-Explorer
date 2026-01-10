# Project Overview

This is **Byte to Offer**, a Next.js 16 tech interview prep platform built with TypeScript, React 19, and Firebase.

## Tech Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **Language**: TypeScript 5.9 (strict mode)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui components (Radix primitives)
- **State**: React Context for auth/theme, react-hook-form for forms
- **AI**: Genkit with Google Gemini models
- **Backend**: Firebase (Firestore, Auth)
- **Testing**: Jest for unit tests, Vitest for component tests, Storybook for visual testing
- **Package Manager**: pnpm 9+

## Path Aliases

Use these import aliases defined in tsconfig.json:
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/features/*` → `./src/features/*`
- `@/lib/*` → `./src/lib/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/types/*` → `./src/types/*`
- `@/providers/*` → `./src/providers/*`
- `@/services/*` → `./src/services/*`

## Key Commands

- `pnpm dev` - Start dev server with Turbopack
- `pnpm dev:all` - Start Next.js + Genkit dev UI
- `pnpm test` - Run Jest tests
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking
- `pnpm validate` - Run all checks (type, lint, test)
- `pnpm gen:component` - Generate new component scaffold
