# AI Layer Documentation 🤖

This directory (`src/ai`) contains the logic for the AI-powered features of the application, built using **[Genkit](https://firebase.google.com/docs/genkit)** and **Google Gemini**.

## Architecture

The AI layer is designed to be modular and type-safe. It consists of:

*   **Configuration (`src/ai/genkit.ts`)**: Initializes the Genkit instance with the Google AI plugin and default model (`gemini-flash-lite-latest`).
*   **Flows (`src/ai/flows/`)**: Self-contained modules that define specific AI tasks (e.g., "Generate Flashcards", "Group Questions").
*   **Development Tools (`src/ai/dev.ts`)**: Utilities for the local Genkit development server.

## Key Concepts

### 1. Flows
A "Flow" is the fundamental unit of work in Genkit. It encapsulates a specific AI operation. Each flow in this project typically:
1.  Defines an **Input Schema** (using Zod) to validate data sent to the AI.
2.  Defines an **Output Schema** (using Zod) to enforce the structure of the AI's response (Structured Output).
3.  Defines a **Prompt** template using `ai.definePrompt`.
4.  Exports a TypeScript function that invokes the flow.

### 2. Structured Output
We use Zod schemas to force the AI models to return JSON data that matches our strict type definitions. This prevents "hallucinated" structures and ensures the frontend can safely render the results.

## Directory Structure

```
src/ai/
├── flows/                  # Individual AI operation definitions
│   ├── find-similar-questions-flow.ts
│   ├── generate-company-strategy-flow.ts
│   ├── generate-flashcards-flow.ts
│   ├── generate-problem-insights-flow.ts
│   └── group-questions.ts
├── dev.ts                  # Local development config
├── genkit.ts               # Genkit instance initialization
└── README.md               # This documentation
```

## How to Add a New AI Feature

To add a new AI capability (e.g., "Summarize Problem Description"):

1.  **Create a new file** in `src/ai/flows/`, e.g., `summarize-problem.ts`.
2.  **Define Zod Schemas**:
    ```typescript
    import { z } from "genkit";

    const InputSchema = z.object({
      text: z.string(),
    });

    const OutputSchema = z.object({
      summary: z.string(),
      keyPoints: z.array(z.string()),
    });
    ```
3.  **Define the Prompt**:
    ```typescript
    import { ai } from "@/ai/genkit";

    const prompt = ai.definePrompt({
      name: "summarizeProblem",
      input: { schema: InputSchema },
      output: { schema: OutputSchema },
      prompt: `Summarize this text: {{text}}`,
    });
    ```
4.  **Define and Export the Flow**:
    ```typescript
    export const summarizeFlow = ai.defineFlow({
      name: "summarizeFlow",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
    }, async (input) => {
      const { output } = await prompt(input);
      return output;
    });
    ```

## Local Development

You can debug prompts and flows using the Genkit Developer UI without running the full Next.js app.

1.  Start the Genkit UI:
    ```bash
    npm run genkit:dev
    ```
2.  Open `http://localhost:4000`.
3.  You can select any defined flow (e.g., `generateProblemInsightsFlow`), provide JSON input, and see the model's output, token usage, and latency.

## Best Practices

*   **Defensive Prompting**: Always include instructions like "Do NOT invent new questions" or "Return empty array if none found" in your prompts.
*   **Validation**: Use `z.describe()` in your Zod schemas. Genkit passes these descriptions to the model to help it understand the expected format.
*   **Error Handling**: AI calls can fail. Ensure the consuming Service (`src/services/ai.service.ts`) handles errors gracefully.
