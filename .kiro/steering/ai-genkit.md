# AI & Genkit Patterns

## Overview

AI features use Genkit with Google Gemini models. All AI logic lives in `src/ai/`.

## Flow Pattern

Each AI feature is a "Flow" - a strongly-typed, deployable unit:

```typescript
// src/ai/flows/{feature}-flow.ts
import { ai } from "@/ai/genkit";
import { z } from "genkit";

// 1. Input Schema
export const InputSchema = z.object({
  topic: z.string(),
});

// 2. Output Schema
export const OutputSchema = z.object({
  summary: z.string(),
  tags: z.array(z.string()),
});

// 3. Prompt Definition
const prompt = ai.definePrompt({
  name: "featurePrompt",
  input: { schema: InputSchema },
  output: { schema: OutputSchema },
  prompt: `
    You are a helpful assistant.
    Analyze: {{topic}}
    Return a summary and tags.
  `,
});

// 4. Flow Definition
export const featureFlow = ai.defineFlow(
  {
    name: "featureFlow",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error("AI failed to generate response");
    return output;
  }
);
```

## Registration

New flows must be imported in `src/ai/dev.ts` to appear in Genkit UI:

```typescript
// src/ai/dev.ts
import "@/ai/flows/my-new-flow.ts";
```

## Usage in App

Call flows from Server Actions:

```typescript
// src/app/actions/ai-action.ts
import { featureFlow } from "@/ai/flows/feature-flow";

export async function generateSummary(topic: string) {
  return await featureFlow({ topic });
}
```

## Development

- `pnpm genkit:dev` - Start Genkit Developer UI at localhost:4000
- `pnpm dev:all` - Run Next.js + Genkit together

## Best Practices

- Always validate input/output with Zod schemas
- Handle null/undefined AI responses gracefully
- Keep prompts focused and specific
- Use Handlebars syntax in prompt templates
