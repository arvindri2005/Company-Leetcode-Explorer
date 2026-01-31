# Architecture Guide

This document describes the architectural layers, module boundaries, and import rules enforced in the Byte to Offer codebase.

## Overview

The application follows a layered architecture with clear separation of concerns. Module boundaries are enforced through ESLint using `eslint-plugin-boundaries` to prevent architectural violations at development time.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Pages     │  │ Components  │  │    Server Actions       │ │
│  │ (src/app)   │  │(src/comp.)  │  │  (src/app/actions)      │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Service Interfaces + Implementations           ││
│  │                  (src/features/*/services)                  ││
│  └──────────────────────────┬──────────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Layer                               │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────┐ │
│  │   Entities    │  │ Value Objects │  │  Domain Services    │ │
│  │(src/domain/   │  │(src/domain/   │  │  (src/domain/       │ │
│  │  entities)    │  │ value-objects)│  │   services)         │ │
│  └───────────────┘  └───────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Repository Interfaces + Implementations           ││
│  │                (src/features/*/repositories)                ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │                    Firebase/Firestore                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### Domain Layer (`src/domain/`)

The domain layer contains the core business logic and is completely isolated from infrastructure concerns.

**Contents:**
- `entities/` - Business entities (Problem, Company, User, Contact)
- `value-objects/` - Immutable value types (Difficulty, ProblemStatus, CompanySize)
- `services/` - Domain services for complex business logic
- `errors/` - Domain-specific error types

**Rules:**
- ✅ Can import from: `domain`, `shared`
- ❌ Cannot import from: `features`, `app`, `lib`, `components`, `repositories`, `services`

**Rationale:** The domain layer must remain pure and testable without any infrastructure dependencies.

### Shared Kernel (`src/shared/`)

Common types, utilities, and interfaces used across multiple features.

**Contents:**
- `types/` - Shared type definitions (Result, Pagination)
- `interfaces/` - Common interfaces (Repository base interface)
- `utils/` - Shared utility functions
- `constants/` - Shared constants

**Rules:**
- ✅ Can import from: `shared`
- ❌ Cannot import from: Any other layer

**Rationale:** The shared kernel must be self-contained to prevent circular dependencies.

### Feature Modules (`src/features/*/`)

Self-contained modules for each domain feature. This is where most application logic lives.

**Standard Structure:**
```
features/{feature}/
├── components/      # Feature-specific React components
├── hooks/           # Feature-specific hooks
├── interfaces/      # Service and repository interfaces
├── services/        # Service implementations (Business Logic)
├── repositories/    # Repository implementations (Data Access)
├── mappers/         # Domain-DTO mappers
├── types/           # Feature-specific types
└── index.ts         # Barrel export (public API)
```

**Rules:**
- ✅ Can import from: `domain`, `shared`, `lib`, `feature` (internal), `types`, `constants`, `components`, `hooks`, `app`, `ai`
- ❌ Cannot import from: Other features' internal files (must use barrel exports)

**Rationale:** Features should be self-contained but can use shared infrastructure and UI components.

### Application Layer (`src/app/`)

Next.js App Router pages, server actions, and API routes.

**Contents:**
- Page components (`page.tsx`)
- Layout components (`layout.tsx`)
- Server actions (`actions/` or inside feature folders if preferred, but usually `src/app/actions`)
- API routes (`api/`)

**Rules:**
- ✅ Can import from: All layers (presentation layer has widest access)
- ❌ Cannot import from: None (but should prefer feature barrel exports)

### Library (`src/lib/`)

Infrastructure utilities, configuration, and dependency injection.

**Contents:**
- `di/` - Dependency injection container (`container.ts`, `registrations.ts`, `tokens.ts`)
- `api/` - API helpers and response utilities
- `config/` - Application configuration (feature flags, navigation)
- `utils/` - General utilities

**Rules:**
- ✅ Can import from: `shared`, `lib`, `types`, `domain`, `feature`
- ❌ Cannot import from: `app`, `components`

### Components (`src/components/`)

Shared UI components used across features.

**Contents:**
- `ui/` - Base shadcn/ui primitives
- `shared/` - Reusable composed components
- `layout/` - Layout components (navbar, footer)
- `sections/` - Page section components

**Rules:**
- ✅ Can import from: `shared`, `lib`, `components`, `hooks`, `types`, `constants`
- ❌ Cannot import from: `features`, `app`, `domain`

### AI Module (`src/lib/ai/`)

Genkit AI flows and services.

**Rules:**
- ✅ Can import from: `shared`, `lib`, `types`, `domain`, `ai`, `feature`
- ❌ Cannot import from: `app`, `components`

## Import Rules Summary

| From \ To      | domain | shared | feature | app | lib | components | hooks | types | ai |
|----------------|--------|--------|---------|-----|-----|------------|-------|-------|-----|
| domain         | ✅     | ✅     | ❌      | ❌  | ❌  | ❌         | ❌    | ❌    | ❌  |
| shared         | ❌     | ✅     | ❌      | ❌  | ❌  | ❌         | ❌    | ❌    | ❌  |
| feature        | ✅     | ✅     | ✅      | ✅  | ✅  | ✅         | ✅    | ✅    | ✅  |
| app            | ✅     | ✅     | ✅      | ✅  | ✅  | ✅         | ✅    | ✅    | ✅  |
| lib            | ✅     | ✅     | ✅      | ❌  | ✅  | ❌         | ❌    | ✅    | ❌  |
| components     | ❌     | ✅     | ❌      | ❌  | ✅  | ✅         | ✅    | ✅    | ❌  |
| hooks          | ❌     | ✅     | ❌      | ❌  | ✅  | ❌         | ✅    | ✅    | ❌  |
| ai             | ✅     | ✅     | ✅      | ❌  | ✅  | ❌         | ❌    | ✅    | ✅  |

## Boundary Enforcement

Module boundaries are enforced using `eslint-plugin-boundaries`. The configuration is in `eslint.config.mjs`.

### Running Boundary Checks

```bash
# Run ESLint to check boundaries
pnpm lint

# The CI pipeline will fail if boundary violations are detected
```

## Dependency Injection (DI)

We use a DI container (in `src/lib/di`) to manage dependencies between Services and Repositories.

1. **Tokens**: Define unique symbols in `src/lib/di/tokens.ts`.
2. **Registration**: Register classes in `src/lib/di/registrations.ts`.
3. **Usage**: Use helper functions (e.g., `getProblemService()`) in Server Actions or API routes to resolve dependencies.

## Adding New Features

When creating a new feature:

1. Create the feature directory structure:
   ```
   src/features/{feature-name}/
   ├── components/
   ├── hooks/
   ├── interfaces/
   ├── services/
   ├── repositories/
   ├── types/
   └── index.ts
   ```

2. Define interfaces first in `interfaces/`
3. Implement services and repositories
4. Register them in `src/lib/di/registrations.ts`
5. Export only public APIs through `index.ts`

## Related Documentation

- [Feature Workflow](./feature-workflow.md)
- [Data Layer](./data-layer.md)
- [Testing](./testing.md)