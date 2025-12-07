# Project Structure and Development Guide

This document provides an overview of the project structure and a guide for adding new features to the existing codebase. The project is built using **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, and **Firebase**.

## Directory Structure

The project follows a **Layered Architecture** to separate concerns (Presentation, Business Logic, Data Access).

```
src/
├── actions/              # (or src/app/actions) Server Actions (standard entry point for mutations)
├── ai/                   # AI logic using Genkit (Flows, configuration)
├── app/                  # Next.js App Router (Pages, Layouts, API routes)
│   ├── (auth)/           # Route groups (e.g., login, signup)
│   ├── companies/        # Feature routes
│   └── ...
├── components/           # React Components
│   ├── ai/               # AI-related components
│   ├── company/          # Company-related components
│   ├── problem/          # Problem-related components
│   ├── ui/               # Reusable UI components (Shadcn UI, etc.)
│   └── shared/           # Shared utility components (Spinners, etc.)
├── constants/            # Global constants
├── contexts/             # React Contexts
├── hooks/                # Custom React Hooks
├── lib/                  # Library configurations and utilities
│   ├── firebase.ts       # Firebase initialization
│   └── utils.ts          # Common utility functions
├── repositories/         # Data Access Layer (Direct DB interactions)
├── services/             # Business Logic Layer (Orchestrates data & rules)
└── types/                # TypeScript type definitions
```

## Architectural Layers

1.  **Presentation Layer (`src/app`, `src/components`)**:
    *   **Pages (`src/app`)**: Server Components by default. Responsible for initial data fetching and layout.
    *   **Components (`src/components`)**: Reusable UI blocks. Organized by feature (e.g., `company`, `ai`) or generic type (`ui`).

2.  **Action Layer (`src/app/actions` or `src/actions`)**:
    *   **Server Actions**: Functions running on the server, callable from Client Components.
    *   **Responsibility**: Validate inputs, authentication checks, and call the **Service Layer**.

3.  **Service Layer (`src/services`)**:
    *   **Encapsulation**: dependent Logic & Orchestration.
    *   **Responsibility**: Contains business rules, validates complex logic, and calls the **Repository Layer**.
    *   **Pattern**: Export singleton instances or classes (e.g., `aiService`, `companyService`).

4.  **Repository Layer (`src/repositories`)**:
    *   **Data Access**: Direct interaction with the database (Firebase/Firestore).
    *   **Responsibility**: CRUD operations, querying, and raw data handling. Return typed objects.

5.  **AI Layer (`src/ai`)**:
    *   **Genkit Flows**: logic for specific AI tasks (e.g., `groupQuestions`).

## Guide: How to Add a New Feature

Follow these steps to ensure your new feature integrates cleanly with the existing architecture.

### Step 1: Define Types
Create or update type definitions in `src/types` to model your data.

```typescript
// src/types/index.ts
export interface NewFeature {
  id: string;
  title: string;
  // ...
}
```

### Step 2: Create a Repository (Data Access)
If your feature needs to read/write to the database, create a repository in `src/repositories`.

```typescript
// src/repositories/new-feature.repository.ts
import { db } from "@/lib/firebase";
import { NewFeature } from "@/types";

export class NewFeatureRepository {
  async getById(id: string): Promise<NewFeature | null> {
    // Firebase logic...
  }
}

export const newFeatureRepository = new NewFeatureRepository();
```

### Step 3: Create a Service (Business Logic)
Create a service in `src/services` to handle business logic. This service should use the repository.

```typescript
// src/services/new-feature.service.ts
import { newFeatureRepository } from "@/repositories/new-feature.repository";

export class NewFeatureService {
  async getFeatureDetails(id: string) {
    if (!id) throw new Error("ID required");
    return await newFeatureRepository.getById(id);
  }
}

export const newFeatureService = new NewFeatureService();
```

### Step 4: Create Server Actions
Create server actions in `src/app/actions` (or `src/actions`) to expose functionality to the UI.

```typescript
// src/app/actions/new-feature.actions.ts
"use server";

import { newFeatureService } from "@/services/new-feature.service";

export async function getFeature(id: string) {
  try {
    return await newFeatureService.getFeatureDetails(id);
  } catch (error) {
    console.error(error);
    return null;
  }
}
```

### Step 5: Create Components
Build your UI components in `src/components/new-feature/`.

```tsx
// src/components/new-feature/feature-card.tsx
import { NewFeature } from "@/types";

export function FeatureCard({ feature }: { feature: NewFeature }) {
  return <div>{feature.title}</div>;
}
```

### Step 6: Create the Page
Finally, add the route in `src/app/new-feature/page.tsx`.

```tsx
// src/app/new-feature/page.tsx
import { getFeature } from "@/app/actions/new-feature.actions";
import { FeatureCard } from "@/components/new-feature/feature-card";

export default async function NewFeaturePage() {
  const data = await getFeature("123");
  return <FeatureCard feature={data} />;
}
```

# Best Practices & Conventions

We enforce strict conventions to ensure consistency and avoid case-sensitivity issues across OS environments (Windows/Linux).

## 1. Naming Conventions

### File System
- **Files:** kebab-case (e.g., `user-profile.tsx`, `api-utils.ts`)
- **Directories:** kebab-case (e.g., `components/auth-flow/`)

#### Next.js Specifics
- **Route Groups:** (kebab-case)
- **Dynamic Params:** [kebab-case]

### Code Identifiers

#### React Components
- PascalCase
- Component name should roughly match the filename (e.g., `user-card.tsx` exports `UserCard`).

#### Functions & Methods
- camelCase (e.g., `getCompanyDetails`)

#### Server Actions
- verb-noun pattern (e.g., `submitForm`, `deleteUser`)

#### Variables
- camelCase (e.g., `userData`)

#### Booleans
- Must use prefixes: `is`, `has`, `should`, `can` (e.g., `isLoading`, `hasPermission`).

#### Constants
- UPPER_SNAKE_CASE (e.g., `DEFAULT_PAGE_SIZE = 20`)

#### Types & Interfaces
- PascalCase (e.g., `CompanyProps`, `UserResponse`)
- Do not use `I` prefix (e.g., `IUser` is forbidden).

## 2. General Best Practices

### Imports
Use absolute imports `@/`:
```ts
import { Button } from "@/components/ui/button";

