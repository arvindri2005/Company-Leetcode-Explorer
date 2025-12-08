# Feature Development Workflow

This guide details the steps to add a new feature to the existing codebase, following our Layered Architecture.

## Step-by-Step Guide

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
