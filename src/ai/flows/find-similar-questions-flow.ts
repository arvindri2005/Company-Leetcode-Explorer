"use server";
/**
 * @fileOverview Finds coding problems similar to a given problem using AI,
 * searching across various online coding platforms.
 *
 * This module defines a Genkit flow that takes a current coding problem as input.
 * It uses an AI model to identify up to 5 problems from platforms like LeetCode,
 * CodingNinjas, GeeksforGeeks, etc., that are conceptually similar to the current one,
 * focusing on algorithms, data structures, problem-solving techniques, or core concepts.
 *
 * @exports findSimilarQuestions - An asynchronous function to initiate the similarity search.
 * @exports FindSimilarQuestionsInput - The Zod inferred type for the input to the flow.
 * @exports FindSimilarQuestionsOutput - The Zod inferred type for the output from the flow.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { retryWithBackoff, sanitizeInput, truncateText } from "@/ai/utils";
import { findSimilarQuestionsCache } from "@/ai/cache";

const CurrentProblemInputSchema = z.object({
  title: z.string().describe("The title of the current coding problem."),
  difficulty: z
    .enum(["Easy", "Medium", "Hard"])
    .describe("The difficulty of the current problem."),
  tags: z
    .array(z.string())
    .describe("A list of tags associated with the current problem."),
  slug: z
    .string()
    .optional()
    .describe("The slug of the current problem, if available."),
});

const FindSimilarQuestionsInputSchema = z.object({
  currentProblem: CurrentProblemInputSchema.describe(
    "The problem for which to find similar ones from various online platforms.",
  ),
});
export type FindSimilarQuestionsInput = z.infer<
  typeof FindSimilarQuestionsInputSchema
>;

const SimilarProblemDetailSchema = z.object({
  title: z.string().describe("The title of the similar problem."),
  difficulty: z
    .enum(["Easy", "Medium", "Hard"])
    .optional()
    .describe("The difficulty of the similar problem, if known."),
  platform: z
    .string()
    .describe(
      "The platform where the problem is hosted (e.g., LeetCode, CodingNinjas, GeeksforGeeks).",
    ),
  link: z.string().describe("The direct link to the similar problem."),
  tags: z
    .array(z.string())
    .optional()
    .describe("A list of tags associated with the similar problem, if known."),
  similarityReason: z
    .string()
    .describe(
      "A brief explanation of why this problem is considered similar (e.g., uses similar data structures, algorithms, or solves a related concept). Limit to 1-2 sentences.",
    ),
});

const FindSimilarQuestionsOutputSchema = z.object({
  similarProblems: z
    .array(SimilarProblemDetailSchema)
    .max(5, "Provide at most 5 similar problems.")
    .describe(
      "An array of up to 5 problems from various online platforms that are conceptually similar to the current problem. Include a reason for similarity for each.",
    ),
});
export type FindSimilarQuestionsOutput = z.infer<
  typeof FindSimilarQuestionsOutputSchema
>;

/**
 * Initiates the AI flow to find problems similar to the input problem from various online platforms.
 * @param {FindSimilarQuestionsInput} input - The current problem details.
 * @returns {Promise<FindSimilarQuestionsOutput>} A promise that resolves to an object containing an array of similar problems.
 */
export async function findSimilarQuestions(
  input: FindSimilarQuestionsInput,
): Promise<FindSimilarQuestionsOutput> {
  return findSimilarQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: "findSimilarQuestionsFromPlatformsPrompt",
  input: { schema: FindSimilarQuestionsInputSchema },
  output: { schema: FindSimilarQuestionsOutputSchema },
  config: {
    temperature: 0.3, // Lower temperature for more deterministic/factual matches
  },
  prompt: `
<system_protocol>
You are "Nova", an expert algorithm curator.
Your task is to identify 1-5 problems from major coding platforms (LeetCode, GeeksforGeeks, CodingNinjas, HackerRank) that are *conceptually* identical or highly similar to the user's problem.

**CORE DIRECTIVES:**
1.  **Similarity over Keyword**: Do not just match words. Match the *underlying technique* (e.g., "Sliding Window", "Monotonic Stack", "Topological Sort").
2.  **Diverse Sources**: Try to find problems from different platforms if possible.
3.  **Accuracy**: The link MUST be valid if possible, or at least point to a real problem title.
4.  **Defensive**: If the input problem is generic (e.g. "Array Sum"), provide the most canonical examples (e.g. "Two Sum").
</system_protocol>

<few_shot_example>
**Input:**
- Title: "Course Schedule"
- Difficulty: "Medium"
- Tags: ["Graph", "Topological Sort"]

**Desired Output:**
{
  "similarProblems": [
    {
      "title": "Detect Cycle in a Directed Graph",
      "platform": "GeeksforGeeks",
      "link": "https://practice.geeksforgeeks.org/problems/detect-cycle-in-a-directed-graph/1",
      "difficulty": "Medium",
      "similarityReason": "Both problems essentially ask you to detect a cycle or determine valid ordering in a DAG using DFS or BFS."
    },
    {
      "title": "Course Schedule II",
      "platform": "LeetCode",
      "link": "https://leetcode.com/problems/course-schedule-ii/",
      "difficulty": "Medium",
      "similarityReason": "Direct extension where you must return the actual ordering, not just validity."
    }
  ]
}
</few_shot_example>

Current Problem:
Title: {{currentProblem.title}}
Difficulty: {{currentProblem.difficulty}}
Tags: {{#if currentProblem.tags.length}}{{currentProblem.tags}}{{else}}No specific tags{{/if}}

Identify up to 5 similar problems.
For each:
1.  Title, Platform, Link, Difficulty.
2.  Concise "similarityReason" (why is the core logic the same?).

Return valid JSON.
`,
});

const findSimilarQuestionsFlow = ai.defineFlow(
  {
    name: "findSimilarQuestionsFlow",
    inputSchema: FindSimilarQuestionsInputSchema,
    outputSchema: FindSimilarQuestionsOutputSchema,
  },
  async (input) => {
    // Nova Guardrail: Sanitization
    const safeTitle = sanitizeInput(input.currentProblem.title);
    // Truncate title if it's absurdly long to prevent token waste
    const truncatedTitle = truncateText(safeTitle, 200);

    // Sanitize tags
    const safeTags = input.currentProblem.tags.map(t => sanitizeInput(t)).slice(0, 10); // Limit tag count

    const safeInput = {
      currentProblem: {
        ...input.currentProblem,
        title: truncatedTitle,
        tags: safeTags
      }
    };

    // Nova Guardrail: Cache Check
    const cacheKey = findSimilarQuestionsCache.generateKey(safeInput);
    const cachedResult = findSimilarQuestionsCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Nova Guardrail: Retry with Exponential Backoff
    const output = await retryWithBackoff(async () => {
      const { output } = await prompt(safeInput);
      if (!output || !output.similarProblems) {
         throw new Error("AI failed to return a valid list of similar problems.");
      }
      return output;
    });

    // Cache the successful result
    findSimilarQuestionsCache.set(cacheKey, output);

    return output;
  },
);
