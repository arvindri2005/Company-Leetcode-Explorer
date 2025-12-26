# Atlas's Journal 🗺️

## Critical Discoveries

- **AI/Genkit "Dark Matter"**: The `src/ai` folder contains the core logic for the AI features (using Genkit & Gemini) but completely lacked documentation. A new developer would struggle to understand how to add a new "Flow" or debug existing ones without reading the source code of every file.

## Knowledge Gaps Identified

- **Missing `src/ai/README.md`**: (SOLVED) No overview of the Genkit architecture, flows, or development workflow.
- **Implicit "Flow" Pattern**: (SOLVED) The pattern of defining Input/Output Zod schemas, a Prompt, and a Flow function in a single file is consistent but undocumented.

## Daily Map-Points
- **[2024-XX-XX]** 🗺️ `src/ai/README.md`: Documented the Genkit AI architecture, "Flow" pattern, and development commands.
