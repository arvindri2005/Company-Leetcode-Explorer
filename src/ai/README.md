# AI Layer Documentation (Genkit)

This directory (`src/ai`) contains the application's AI logic, powered by [Genkit](https://firebase.google.com/docs/genkit) and Google Gemini models.

## 🧠 Overview

The AI layer is structured around **Flows**. A "Flow" is a strongly-typed, deployable unit of AI logic that:
1.  Accepts specific inputs (validated by Zod).
2.  Interacts with an AI model via a **Prompt**.
3.  Returns structured output (validated by Zod).

This architecture ensures that AI interactions are reliable, type-safe, and easy to test.

## 📂 Directory Structure

```
src/ai/
├── flows/             # Individual AI Flows (The core logic)
│   ├── find-similar-questions-flow.ts
│   ├── generate-company-strategy-flow.ts
│   └── ...
├── dev.ts             # Entry point for the local Genkit Developer UI
├── genkit.ts          # Genkit instance configuration (Model selection)
└── README.md          # You are here
```

## 🌊 The "Flow" Pattern

All AI features follow a consistent pattern. To add a new AI feature, you typically create a single file in `flows/` that contains:

1.  **Input Schema**: A Zod schema defining what data the AI needs.
2.  **Output Schema**: A Zod schema defining exactly what the AI must return (JSON).
3.  **Prompt Definition**: A template string (using Handlebars syntax) that instructs the AI.
4.  **Flow Definition**: The executable function that ties it all together.

### Example Template

```typescript
import { ai } from "@/ai/genkit";
import { z } from "genkit";

// 1. Define Input
export const MyInputSchema = z.object({
  topic: z.string(),
});

// 2. Define Output
export const MyOutputSchema = z.object({
  summary: z.string(),
  tags: z.array(z.string()),
});

// 3. Define Prompt
const myPrompt = ai.definePrompt({
  name: "myFeaturePrompt",
  input: { schema: MyInputSchema },
  output: { schema: MyOutputSchema },
  prompt: `
    You are a helpful assistant.
    Analyze the topic: {{topic}}
    Return a summary and relevant tags.
  `,
});

// 4. Define Flow
export const myFeatureFlow = ai.defineFlow(
  {
    name: "myFeatureFlow",
    inputSchema: MyInputSchema,
    outputSchema: MyOutputSchema,
  },
  async (input) => {
    // Execute the prompt
    const { output } = await myPrompt(input);
    
    if (!output) {
      throw new Error("AI failed to generate response");
    }
    
    return output;
  }
);
```

## 🛠️ Development

We use the Genkit Developer UI to test and debug prompts without running the full Next.js app.

### 1. Start the Genkit UI
```bash
pnpm genkit:dev
```
This runs `src/ai/dev.ts` and opens the developer tool at `http://localhost:4000`.

### 2. Registering New Flows
If you add a new flow file, **you must import it in `src/ai/dev.ts`** for it to appear in the Genkit UI.

```typescript
// src/ai/dev.ts
import "@/ai/flows/my-new-flow.ts"; // Add this line
```

## 📦 Integration

To use a flow in the application (e.g., in a Server Action), simply import the flow function and call it like a normal async function.

```typescript
// src/app/actions/some-action.ts
import { myFeatureFlow } from "@/ai/flows/my-new-flow";

export async function generateSummary(topic: string) {
  const result = await myFeatureFlow({ topic });
  return result;
}
```

## 🔍 Key Configuration

- **Model**: Configured in `src/ai/genkit.ts`. Currently defaults to `googleai/gemini-flash-lite-latest`.
- **Plugins**: Uses `@genkit-ai/googleai`.
