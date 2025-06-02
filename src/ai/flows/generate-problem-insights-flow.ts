
'use server';
/**
 * @fileOverview Generates key concepts, common data structures/algorithms, and a high-level hint for a coding problem.
 *
 * This module defines a Genkit flow that takes details of a coding problem (title, difficulty,
 * tags, description) as input. It uses an AI model to identify key concepts, common data structures,
 * common algorithms, and provide a high-level hint to guide the user's thinking towards a solution.
 *
 * @exports generateProblemInsights - An asynchronous function to initiate insight generation.
 * @exports GenerateProblemInsightsInput - The Zod inferred type for the input to the flow.
 * @exports GenerateProblemInsightsOutput - The Zod inferred type for the output from the flow.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const GenerateProblemInsightsInputSchema = z.object({
  title: z.string().describe("The title of the coding problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the problem."),
  tags: z.array(z.string()).describe("A list of tags associated with the problem."),
  problemDescription: z.string().describe("A concise description or summary of the coding problem, potentially including its core requirements, constraints, and its coding link for context."),
});
export type GenerateProblemInsightsInput = z.infer<typeof GenerateProblemInsightsInputSchema>;

const GenerateProblemInsightsOutputSchema = z.object({
  keyConcepts: z.array(z.string())
    .min(1, "Provide at least one key concept.")
    .max(4, "Provide at most 4 key concepts.")
    .describe("A list of 1-4 key concepts or general problem-solving patterns relevant to this problem (e.g., 'Two Pointers', 'Sliding Window', 'Graph Traversal')."),
  commonDataStructures: z.array(z.string())
    .min(1, "Provide at least one common data structure.")
    .max(3, "Provide at most 3 common data structures.")
    .describe("A list of 1-3 common data structures that are often useful for solving this type of problem (e.g., 'Hash Map', 'Priority Queue', 'Set')."),
  commonAlgorithms: z.array(z.string())
    .min(1, "Provide at least one common algorithm or technique.")
    .max(3, "Provide at most 3 common algorithms or techniques.")
    .describe("A list of 1-3 common algorithms or techniques that might be applicable (e.g., 'Binary Search', 'Depth-First Search', 'Dynamic Programming state transition')."),
  highLevelHint: z.string()
    .min(1, "A hint is required.")
    .describe("A single, high-level, conceptual hint (1-2 sentences) that guides the user's thinking towards a solution approach without revealing the solution itself or specific implementation steps. Focus on the 'how to think about it' rather than 'what to code'."),
});
export type GenerateProblemInsightsOutput = z.infer<typeof GenerateProblemInsightsOutputSchema>;

/**
 * Initiates the AI flow to generate insights for a coding problem.
 * @param {GenerateProblemInsightsInput} input - The problem details (title, difficulty, tags, description).
 * @returns {Promise<GenerateProblemInsightsOutput>} A promise that resolves to an object containing key concepts, common data structures/algorithms, and a hint.
 */
export async function generateProblemInsights(input: GenerateProblemInsightsInput): Promise<GenerateProblemInsightsOutput> {
  return generateProblemInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProblemInsightsPrompt',
  input: {schema: GenerateProblemInsightsInputSchema},
  output: {schema: GenerateProblemInsightsOutputSchema},
  prompt: `You are an expert coding interview coach. A user is looking for insights into the following problem:

Problem Title: {{title}}
Difficulty: {{difficulty}}
Tags: {{#if tags.length}}{{tags}}{{else}}No specific tags{{/if}}
Problem Description/Summary:
{{{problemDescription}}}

Your Task:
Analyze the problem based on the provided details. Your goal is to help the user understand the problem's nature and how to approach it, without giving away the solution.

Provide the following in the specified JSON format:
1.  "keyConcepts": Identify 1 to 4 core computer science concepts or problem-solving patterns that are central to this problem (e.g., "Two Pointers", "Sliding Window", "State Management in DP", "Topological Sort").
2.  "commonDataStructures": List 1 to 3 data structures that are commonly employed or particularly useful for solving this type of problem (e.g., "Hash Map", "Min-Heap", "Adjacency List").
3.  "commonAlgorithms": List 1 to 3 algorithms or general techniques that are often applicable (e.g., "Binary Search on Answer", "Backtracking with Pruning", "BFS for Shortest Path").
4.  "highLevelHint": Craft a single, concise (1-2 sentences) high-level conceptual hint. This hint should guide the user's thinking process or suggest a perspective to consider. **Crucially, DO NOT reveal any part of the actual solution, specific implementation steps, or pseudo-code.** For example, instead of "Iterate through the array and store elements in a hash map", a better hint might be "Consider how you can efficiently check for previously seen elements." or "How can you systematically explore all possibilities while avoiding redundant computations?".

Be insightful and focus on the underlying principles.
`,
});

const generateProblemInsightsFlow = ai.defineFlow(
  {
    name: 'generateProblemInsightsFlow',
    inputSchema: GenerateProblemInsightsInputSchema,
    outputSchema: GenerateProblemInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.highLevelHint || output.keyConcepts.length === 0) {
        // Fallback or throw error
        throw new Error("AI failed to generate complete problem insights. The output was incomplete or invalid.");
    }
    return output;
  }
);
