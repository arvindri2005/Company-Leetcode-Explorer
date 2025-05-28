
// use server'

/**
 * @fileOverview Groups LeetCode problems into related themes, concepts, or categories using AI.
 *
 * This module defines a Genkit flow that takes an array of LeetCode questions and uses
 * an AI model to categorize them into logical groups based on underlying data structures,
 * algorithms, or common problem-solving patterns.
 *
 * @exports groupQuestions - An asynchronous function to initiate the question grouping.
 * @exports GroupQuestionsInput - The Zod inferred type for the input to the flow.
 * @exports GroupQuestionsOutput - The Zod inferred type for the output from the flow.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const GroupQuestionsInputSchema = z.object({
  questions: z.array(
    z.object({
      title: z.string(),
      difficulty: z.enum(['Easy', 'Medium', 'Hard']),
      link: z.string().url(),
      tags: z.array(z.string()),
    })
  ).describe('An array of LeetCode questions with their details.'),
});
export type GroupQuestionsInput = z.infer<typeof GroupQuestionsInputSchema>;

// New, more explicit output schema
const GroupedQuestionItemSchema = z.object({
  title: z.string().describe("The title of the LeetCode problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the problem."),
  link: z.string().describe("The direct link to the LeetCode problem."), // Removed .url()
  tags: z.array(z.string()).describe("A list of tags associated with the problem."),
});

const QuestionGroupSchema = z.object({
  groupName: z.string().describe("The name of the category or theme for this group of questions (e.g., 'Arrays', 'Dynamic Programming')."),
  questions: z.array(GroupedQuestionItemSchema).describe("An array of LeetCode problems belonging to this group."),
});

const GroupQuestionsOutputSchema = z.object({
  groups: z.array(QuestionGroupSchema)
    .describe('An array of question groups. Each group has a name and a list of associated LeetCode problems.'),
});
export type GroupQuestionsOutput = z.infer<typeof GroupQuestionsOutputSchema>;

/**
 * Initiates the AI flow to group LeetCode questions by theme or concept.
 * @param {GroupQuestionsInput} input - An object containing an array of questions to be grouped.
 * @returns {Promise<GroupQuestionsOutput>} A promise that resolves to an object containing an array of question groups.
 */
export async function groupQuestions(input: GroupQuestionsInput): Promise<GroupQuestionsOutput> {
  return groupQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'groupQuestionsPrompt',
  input: {schema: GroupQuestionsInputSchema},
  output: {schema: GroupQuestionsOutputSchema},
  prompt: `You are an expert in organizing LeetCode questions based on their underlying data structures and algorithms.

  Given the following LeetCode questions, group them into related themes, concepts, or categories.
  The output should be a JSON object with a single key "groups".
  The value of "groups" should be an array, where each element is an object.
  Each object in the "groups" array should have two keys:
  1. "groupName": A string representing the name of the group (e.g., Arrays, Linked Lists, Dynamic Programming).
  2. "questions": An array of the LeetCode problem objects (including title, difficulty, link, and tags) that belong to this group.

  Questions:
  {{#each questions}}
  - Title: {{this.title}}
    Difficulty: {{this.difficulty}}
    Link: {{this.link}}
    Tags: {{#if this.tags.length}}{{this.tags}}{{else}}No specific tags{{/if}}
  {{/each}}
  `,
});

const groupQuestionsFlow = ai.defineFlow(
  {
    name: 'groupQuestionsFlow',
    inputSchema: GroupQuestionsInputSchema,
    outputSchema: GroupQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI did not return an output for question grouping.");
    }
    return output;
  }
);
