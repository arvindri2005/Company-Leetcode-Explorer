# Feature Development Workflow

This guide details the steps to add a new feature to the existing codebase, strictly following our **Feature-Based Layered Architecture** and **Dependency Injection** patterns.

## Step-by-Step Guide

Follow these steps to ensure your new feature integrates cleanly with the existing architecture.

### Step 1: Create Feature Directory Structure
Create the directory structure for your new feature in `src/features/{feature-name}`.

```bash
src/features/new-feature/
├── components/      # UI Components
├── hooks/           # Feature-specific hooks
├── interfaces/      # Interfaces for Services and Repositories
├── repositories/    # Data access implementations
├── services/        # Business logic implementations
├── types/           # Domain models and DTOs
└── index.ts         # Public API
```

### Step 2: Define Domain Models & Types
Create type definitions in `src/features/new-feature/types/index.ts` (or specific files).

```typescript
// src/features/new-feature/types/index.ts
export interface NewFeature {
  id: string;
  title: string;
  createdAt: Date;
  // ...
}
```

### Step 3: Define Interfaces
Define the contracts for your Repository and Service in `src/features/new-feature/interfaces/`.

```typescript
// src/features/new-feature/interfaces/new-feature.repository.interface.ts
import { NewFeature } from "../types";

export interface INewFeatureRepository {
  getById(id: string): Promise<NewFeature | null>;
  // ...
}
```

```typescript
// src/features/new-feature/interfaces/new-feature.service.interface.ts
import { NewFeature } from "../types";

export interface INewFeatureService {
  getFeatureDetails(id: string): Promise<NewFeature | null>;
}
```

### Step 4: Implement Repository
Implement the repository in `src/features/new-feature/repositories/`.

```typescript
// src/features/new-feature/repositories/new-feature.repository.ts
import { db } from "@/lib/firebase";
import { INewFeatureRepository } from "../interfaces/new-feature.repository.interface";
import { NewFeature } from "../types";

export class NewFeatureRepository implements INewFeatureRepository {
  async getById(id: string): Promise<NewFeature | null> {
    // Firebase logic...
    // Remember to validate data with Zod schemas here!
  }
}
```

### Step 5: Implement Service
Implement the service in `src/features/new-feature/services/`.

```typescript
// src/features/new-feature/services/new-feature.service.ts
import { INewFeatureRepository } from "../interfaces/new-feature.repository.interface";
import { INewFeatureService } from "../interfaces/new-feature.service.interface";

export class NewFeatureService implements INewFeatureService {
  constructor(private readonly repository: INewFeatureRepository) {}

  async getFeatureDetails(id: string) {
    if (!id) throw new Error("ID required");
    return await this.repository.getById(id);
  }
}
```

### Step 6: Register in Dependency Injection Container
You must register your new classes in the DI container to make them usable.

**A. Add Tokens**
Add unique symbols to `src/lib/di/tokens.ts`.

```typescript
// src/lib/di/tokens.ts
export const TOKENS = {
  // ... existing tokens
  NewFeatureService: Symbol("NewFeatureService"),
  NewFeatureRepository: Symbol("NewFeatureRepository"),
} as const;
```

**B. Register and Export Helpers**
Update `src/lib/di/registrations.ts`.

```typescript
// src/lib/di/registrations.ts
// ... imports

// 1. Register in registerDependencies()
export function registerDependencies(): void {
  // ...
  
  container.register<INewFeatureRepository>(
    TOKENS.NewFeatureRepository,
    () => new NewFeatureRepository(),
    { singleton: true }
  );

  container.register<INewFeatureService>(
    TOKENS.NewFeatureService,
    () => new NewFeatureService(
      container.resolve<INewFeatureRepository>(TOKENS.NewFeatureRepository)
    ),
    { singleton: true }
  );
}

// 2. Add Helper Getters
export function getNewFeatureService(): INewFeatureService {
  return container.resolve<INewFeatureService>(TOKENS.NewFeatureService);
}
```

### Step 7: Create Server Actions
Create server actions in `src/app/actions` to expose functionality to the UI. Use the DI helper to get the service.

```typescript
// src/app/actions/new-feature.actions.ts
"use server";

import { getNewFeatureService } from "@/lib/di/registrations";

export async function getFeature(id: string) {
  const service = getNewFeatureService();
  try {
    return await service.getFeatureDetails(id);
  } catch (error) {
    console.error(error);
    return null;
  }
}
```

### Step 8: Create UI Components & Page
Build your UI in `src/features/new-feature/components/` and the page in `src/app/new-feature/page.tsx`.

```tsx
// src/app/new-feature/page.tsx
import { getFeature } from "@/app/actions/new-feature.actions";
// ...
```