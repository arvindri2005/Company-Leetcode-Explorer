# Architecture Guidelines

## Directory Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # Shared UI components
│   ├── ui/          # Base shadcn/ui primitives (button, card, etc.)
│   ├── shared/      # Reusable composed components
│   ├── layout/      # Layout components (navbar, footer, etc.)
│   └── sections/    # Page section components
├── features/        # Feature-based modules (domain logic)
├── hooks/           # Global custom React hooks
├── lib/             # Utilities, configs, API helpers
├── providers/       # Global context providers
├── repositories/    # Data access layer (Firestore)
├── services/        # Business logic services
├── types/           # Shared TypeScript types
├── ai/              # Genkit AI flows and prompts
└── constants/       # App-wide constants
```

## Feature-Based Architecture

Features are self-contained modules in `src/features/`. Each feature should have:

```
features/{feature-name}/
├── components/      # Feature-specific components
├── hooks/           # Feature-specific hooks
├── services/        # Feature business logic
├── types/           # Feature types
├── utils/           # Feature utilities
├── context/         # Feature context (if needed)
├── api/             # Feature API helpers (if needed)
└── index.ts         # Barrel exports
```

### Feature Rules

1. Features should be independent and not import from other features directly
2. Shared logic goes in `src/lib/`, `src/hooks/`, or `src/services/`
3. Each feature must have an `index.ts` barrel file exporting public API
4. Import from features using: `import { Component } from '@/features/auth'`

## Data Flow Pattern

```
UI Component → Service → Repository → Firebase
     ↑            ↓
     └── Types/Schemas
```

- **Repositories**: Handle raw data access (Firestore queries)
- **Services**: Business logic, validation, data transformation
- **Components**: UI rendering, user interactions

## Provider Order (in layout.tsx)

1. ThemeProvider (outermost)
2. AuthProvider
3. Feature-specific providers
