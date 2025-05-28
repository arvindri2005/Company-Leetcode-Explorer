
'use server';
/**
 * @fileOverview Finds LeetCode problems similar to a given problem using AI.
 *
 * This module defines a Genkit flow that takes a current LeetCode problem and a list of
 * candidate problems as input. It uses an AI model to identify up to 5 candidate problems
 * that are conceptually similar to the current one, focusing on algorithms, data structures,
 * problem-solving techniques, or core concepts.
 *
 * @exports findSimilarQuestions - An asynchronous function to initiate the similarity search.
 * @exports FindSimilarQuestionsInput - The Zod inferred type for the input to the flow.
 * @exports FindSimilarQuestionsOutput - The Zod inferred type for the output from the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// CurrentProblemInput and CandidateProblemInput are not directly exported but are part of FindSimilarQuestionsInputSchema
// SimilarProblemDetail is part of FindSimilarQuestionsOutputSchema and is exported as part of it.


const CurrentProblemInputSchema = z.object({
  title: z.string().describe("The title of the current LeetCode problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the current problem."),
  tags: z.array(z.string()).describe("A list of tags associated with the current problem."),
});

const CandidateProblemInputSchema = z.object({
  id: z.string(),
  title: z.string().describe("The title of a candidate LeetCode problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the candidate problem."),
  tags: z.array(z.string()).describe("A list of tags associated with the candidate problem."),
  link: z.string().url().describe("The direct link to the candidate LeetCode problem."),
});

const FindSimilarQuestionsInputSchema = z.object({
  currentProblem: CurrentProblemInputSchema.describe("The problem for which to find similar ones."),
  candidateProblems: z.array(CandidateProblemInputSchema).describe("A list of all other LeetCode problems to consider for similarity."),
});
export type FindSimilarQuestionsInput = z.infer<typeof FindSimilarQuestionsInputSchema>;

const SimilarProblemDetailSchema = z.object({
  title: z.string().describe("The title of the similar LeetCode problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the similar problem."),
  link: z.string().describe("The direct link to the similar LeetCode problem."), // Removed .url()
  tags: z.array(z.string()).describe("A list of tags associated with the similar problem."),
  similarityReason: z.string().describe("A brief explanation of why this problem is considered similar (e.g., uses similar data structures, algorithms, or solves a related concept). Limit to 1-2 sentences."),
});

const FindSimilarQuestionsOutputSchema = z.object({
  similarProblems: z.array(SimilarProblemDetailSchema)
    .max(5, "Provide at most 5 similar problems.")
    .describe('An array of up to 5 LeetCode problems that are conceptually similar to the current problem. Include a reason for similarity for each.'),
});
export type FindSimilarQuestionsOutput = z.infer<typeof FindSimilarQuestionsOutputSchema>;

/**
 * Initiates the AI flow to find LeetCode problems similar to the input problem.
 * @param {FindSimilarQuestionsInput} input - The current problem and a list of candidate problems.
 * @returns {Promise<FindSimilarQuestionsOutput>} A promise that resolves to an object containing an array of similar problems.
 */
export async function findSimilarQuestions(input: FindSimilarQuestionsInput): Promise<FindSimilarQuestionsOutput> {
  return findSimilarQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findSimilarQuestionsPrompt',
  input: {schema: FindSimilarQuestionsInputSchema},
  output: {schema: FindSimilarQuestionsOutputSchema},
  prompt: `You are an expert LeetCode coach. Your task is to identify up to 5 problems from a list of candidate problems that are conceptually similar to a given current problem.
Focus on similarity in terms of underlying algorithms, data structures, problem-solving techniques, or core concepts. Do not just match based on tags alone.

Current Problem:
Title: {{currentProblem.title}}
Difficulty: {{currentProblem.difficulty}}
Tags: {{#if currentProblem.tags.length}}{{currentProblem.tags}}{{else}}No specific tags{{/if}}

List of Candidate Problems to evaluate for similarity:
{{#each candidateProblems}}
- Title: {{this.title}}
  Difficulty: {{this.difficulty}}
  Link: {{this.link}}
  Tags: {{#if this.tags.length}}{{this.tags}}{{else}}No specific tags{{/if}}
{{/each}}

Based on the current problem, identify up to 5 similar problems from the candidate list. For each similar problem you identify, provide its title, difficulty, link, tags, and a concise 'similarityReason' (1-2 sentences) explaining *why* it's similar (e.g., "Uses a similar sliding window approach", "Requires dynamic programming with a similar state transition", "Both involve graph traversal (DFS/BFS) on a grid").

Return your findings in the specified JSON format with a "similarProblems" array.
If no truly similar problems are found from the candidate list, return an empty "similarProblems" array.
`,
});

const findSimilarQuestionsFlow = ai.defineFlow(
  {
    name: 'findSimilarQuestionsFlow',
    inputSchema: FindSimilarQuestionsInputSchema,
    outputSchema: FindSimilarQuestionsOutputSchema,
  },
  async input => {
    // Basic filtering if candidate list is too large - this is a placeholder,
    // more sophisticated pre-filtering might be needed for very large datasets.
    // For now, we assume the model can handle a reasonable number of candidates.
    // if (input.candidateProblems.length > 100) {
    //   // Potentially, filter candidates by at least one common tag, etc.
    // }

    const {output} = await prompt(input);
    if (!output) {
      // If AI returns nothing, default to empty array as per prompt instructions.
      return { similarProblems: [] };
    }
    return output;
  }
);
