
'use server';
/**
 * @fileOverview Finds LeetCode problems similar to a given problem using AI,
 * searching across various online coding platforms.
 *
 * This module defines a Genkit flow that takes a current LeetCode problem as input.
 * It uses an AI model to identify up to 5 problems from platforms like LeetCode,
 * CodingNinjas, GeeksforGeeks, etc., that are conceptually similar to the current one,
 * focusing on algorithms, data structures, problem-solving techniques, or core concepts.
 *
 * @exports findSimilarQuestions - An asynchronous function to initiate the similarity search.
 * @exports FindSimilarQuestionsInput - The Zod inferred type for the input to the flow.
 * @exports FindSimilarQuestionsOutput - The Zod inferred type for the output from the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CurrentProblemInputSchema = z.object({
  title: z.string().describe("The title of the current LeetCode problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the current problem."),
  tags: z.array(z.string()).describe("A list of tags associated with the current problem."),
  slug: z.string().optional().describe("The slug of the current problem, if available."), // Added optional slug
});

const FindSimilarQuestionsInputSchema = z.object({
  currentProblem: CurrentProblemInputSchema.describe("The problem for which to find similar ones from various online platforms."),
});
export type FindSimilarQuestionsInput = z.infer<typeof FindSimilarQuestionsInputSchema>;

const SimilarProblemDetailSchema = z.object({
  title: z.string().describe("The title of the similar problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().describe("The difficulty of the similar problem, if known."),
  platform: z.string().describe("The platform where the problem is hosted (e.g., LeetCode, CodingNinjas, GeeksforGeeks)."),
  link: z.string().describe("The direct link to the similar problem."),
  tags: z.array(z.string()).optional().describe("A list of tags associated with the similar problem, if known."),
  similarityReason: z.string().describe("A brief explanation of why this problem is considered similar (e.g., uses similar data structures, algorithms, or solves a related concept). Limit to 1-2 sentences."),
});

const FindSimilarQuestionsOutputSchema = z.object({
  similarProblems: z.array(SimilarProblemDetailSchema)
    .max(5, "Provide at most 5 similar problems.")
    .describe('An array of up to 5 problems from various online platforms that are conceptually similar to the current problem. Include a reason for similarity for each.'),
});
export type FindSimilarQuestionsOutput = z.infer<typeof FindSimilarQuestionsOutputSchema>;

/**
 * Initiates the AI flow to find problems similar to the input problem from various online platforms.
 * @param {FindSimilarQuestionsInput} input - The current problem details.
 * @returns {Promise<FindSimilarQuestionsOutput>} A promise that resolves to an object containing an array of similar problems.
 */
export async function findSimilarQuestions(input: FindSimilarQuestionsInput): Promise<FindSimilarQuestionsOutput> {
  return findSimilarQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findSimilarQuestionsFromPlatformsPrompt',
  input: {schema: FindSimilarQuestionsInputSchema},
  output: {schema: FindSimilarQuestionsOutputSchema},
  prompt: `You are an expert LeetCode coach and programming problem curator.
Your task is to identify up to 5 problems from various online coding platforms (like LeetCode, CodingNinjas, GeeksforGeeks, HackerRank, etc.) that are conceptually similar to a given current problem.
Focus on similarity in terms of underlying algorithms, data structures, problem-solving techniques, or core concepts.

Current Problem:
Title: {{currentProblem.title}}
Difficulty: {{currentProblem.difficulty}}
Tags: {{#if currentProblem.tags.length}}{{currentProblem.tags}}{{else}}No specific tags{{/if}}

Based on the current problem, identify up to 5 similar problems. For each similar problem you identify:
1.  Provide its "title".
2.  Specify the "platform" where it can be found (e.g., "LeetCode", "CodingNinjas", "GeeksforGeeks").
3.  Provide a direct "link" to the problem.
4.  If known, state its "difficulty" (Easy, Medium, Hard).
5.  If known, list relevant "tags".
6.  Provide a concise "similarityReason" (1-2 sentences) explaining *why* it's similar (e.g., "Uses a similar sliding window approach", "Requires dynamic programming with a similar state transition", "Both involve graph traversal (DFS/BFS) on a grid").

Return your findings in the specified JSON format with a "similarProblems" array.
If no truly similar problems are found, return an empty "similarProblems" array.
Ensure the links provided are accurate and lead directly to the problem page if possible.
`,
});

const findSimilarQuestionsFlow = ai.defineFlow(
  {
    name: 'findSimilarQuestionsFlow',
    inputSchema: FindSimilarQuestionsInputSchema,
    outputSchema: FindSimilarQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // If AI returns nothing, default to empty array as per prompt instructions.
      return { similarProblems: [] };
    }
    return output;
  }
);
