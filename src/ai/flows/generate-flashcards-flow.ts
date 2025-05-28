
'use server';
/**
 * @fileOverview Generates study flashcards for a company based on its frequently asked LeetCode problems.
 *
 * This module defines a Genkit flow that takes a company name and a list of its associated
 * LeetCode problems as input. It uses an AI model to generate 3 to 10 flashcards,
 * each with a front (question/concept) and a back (answer/explanation), designed to help
 * users recall important concepts and problem-solving techniques.
 *
 * @exports generateFlashcardsForCompany - An asynchronous function to initiate flashcard generation.
 * @exports GenerateFlashcardsInput - The Zod inferred type for the input to the flow.
 * @exports GenerateFlashcardsOutput - The Zod inferred type for the output from the flow.
 * @exports Flashcard - The Zod inferred type for a single flashcard object (re-exported).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { FlashcardProblemInput, Flashcard } from '@/types';

const FlashcardProblemInputSchema = z.object({
  title: z.string().describe("The title of the LeetCode problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the problem."),
  tags: z.array(z.string()).describe("A list of tags associated with the problem."),
});

const GenerateFlashcardsInputSchema = z.object({
  companyName: z.string().describe("The name of the company for which to generate flashcards."),
  problems: z.array(FlashcardProblemInputSchema).min(1, "At least one problem is required to generate flashcards.")
    .describe("A list of LeetCode problems frequently asked by this company."),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
  front: z.string().describe("The question, concept, or problem title on the front of the flashcard. Keep it concise (max 2-3 sentences)."),
  back: z.string().describe("The answer, explanation, key data structures/algorithms, or relevant problem-solving strategy on the back of the flashcard. Keep it concise and informative (max 3-4 sentences)."),
});
export type { Flashcard }; // Export the Zod inferred type as Flashcard as well

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema)
    .min(3, "Generate at least 3 flashcards.")
    .max(10, "Generate at most 10 flashcards.")
    .describe('An array of 3 to 10 generated flashcards.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

/**
 * Initiates the AI flow to generate study flashcards for a company.
 * @param {GenerateFlashcardsInput} input - The company name and a list of its problems.
 * @returns {Promise<GenerateFlashcardsOutput>} A promise that resolves to an object containing an array of generated flashcards.
 */
export async function generateFlashcardsForCompany(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert LeetCode coach creating study flashcards for interview preparation.
The user is preparing for interviews at {{companyName}}.
You are given a list of LeetCode problems frequently asked by this company:
{{#each problems}}
- Problem: "{{this.title}}" ({{this.difficulty}}) - Tags: [{{#if this.tags.length}}{{this.tags}}{{else}}No specific tags{{/if}}]
{{/each}}

Your task is to generate 3 to 10 high-quality flashcards.
Each flashcard should help a candidate recall important concepts, problem-solving techniques, data structures, or algorithms relevant to the types of problems {{companyName}} asks.

Flashcard Content Guidelines:
- The "front" of the flashcard could be:
    - A direct question about a concept (e.g., "When is a Heap a suitable data structure for problems asked by {{companyName}}?").
    - A problem category or pattern (e.g., "Describe a common approach for string manipulation problems favored by {{companyName}}.").
    - A slightly rephrased problem title if it uniquely represents a core pattern, or a question based on a common problem (e.g., "Key insight for 'Two Sum' type problems?").
- The "back" of the flashcard should provide:
    - A concise answer to the question on the front.
    - Key insights, trade-offs, or typical time/space complexity.
    - Relevant data structures or algorithms.
    - For problem-specific fronts, the back could mention the primary data structure/algorithm or a key trick, not the full solution.
- Do NOT just list problem details from the input. Create actual study questions/prompts and answers.
- Ensure variety in the flashcards, covering different tags, difficulties, and concepts if possible from the provided problem list.
- Keep the content for both front and back concise and easy to digest.

Return your findings in the specified JSON format with a "flashcards" array.
Generate between 3 and 10 flashcards.
`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.flashcards || output.flashcards.length === 0) {
      // Fallback to an empty array if AI doesn't produce valid output or no flashcards.
      return { flashcards: [] }; 
    }
    return output;
  }
);
