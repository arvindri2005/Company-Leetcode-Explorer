// use server'

/**
 * @fileOverview Groups coding problems into related themes, concepts, or categories using AI.
 *
 * This module defines a Genkit flow that takes an array of coding questions and uses
 * an AI model to categorize them into logical groups based on underlying data structures,
 * algorithms, or common problem-solving patterns.
 *
 * @exports groupQuestions - An asynchronous function to initiate the question grouping.
 * @exports GroupQuestionsInput - The Zod inferred type for the input to the flow.
 * @exports GroupQuestionsOutput - The Zod inferred type for the output from the flow.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { groupQuestionsCache } from "@/ai/cache";
import { retryWithBackoff, truncateText, sanitizeInput } from "@/ai/utils";
import { getModelForIntent } from "@/ai/model-registry";

const GroupQuestionsInputSchema = z.object({
  questions: z
    .array(
      z.object({
        title: z.string(),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        link: z.string().url(),
        tags: z.array(z.string()),
      }),
    )
    .describe("An array of coding questions with their details."),
});
export type GroupQuestionsInput = z.infer<typeof GroupQuestionsInputSchema>;

// New, more explicit output schema
const GroupedQuestionItemSchema = z.object({
  title: z.string().describe("The title of the coding problem."),
  difficulty: z
    .enum(["Easy", "Medium", "Hard"])
    .describe("The difficulty of the problem."),
  link: z.string().describe("The direct link to the coding problem."), // Removed .url()
  tags: z
    .array(z.string())
    .describe("A list of tags associated with the problem."),
});

const QuestionGroupSchema = z.object({
  groupName: z
    .string()
    .describe(
      "The name of the category or theme for this group of questions (e.g., 'Arrays', 'Dynamic Programming').",
    ),
  questions: z
    .array(GroupedQuestionItemSchema)
    .describe("An array of coding problems belonging to this group."),
});

const GroupQuestionsOutputSchema = z.object({
  groups: z
    .array(QuestionGroupSchema)
    .describe(
      "An array of question groups. Each group has a name and a list of associated coding problems.",
    ),
});
export type GroupQuestionsOutput = z.infer<typeof GroupQuestionsOutputSchema>;

/**
 * Initiates the AI flow to group coding questions by theme or concept.
 * @param {GroupQuestionsInput} input - An object containing an array of questions to be grouped.
 * @returns {Promise<GroupQuestionsOutput>} A promise that resolves to an object containing an array of question groups.
 */
export async function groupQuestions(
  input: GroupQuestionsInput,
): Promise<GroupQuestionsOutput> {
  return groupQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: "groupQuestionsPrompt",
  input: { schema: GroupQuestionsInputSchema },
  output: { schema: GroupQuestionsOutputSchema },
  model: getModelForIntent("standard"),
  config: {
    temperature: 0.2, // Low temperature for deterministic grouping
    maxOutputTokens: 2048,
  },
  prompt: `
<system_protocol>
You are "Nova", an expert technical interview coach.
Your task is to organize a list of LeetCode-style questions into logical, study-friendly groups based on shared data structures, algorithms, or patterns.

**CORE DIRECTIVES:**
1.  **Strict Fidelity**: Do NOT invent new questions. Do NOT modify the Title, Link, or Difficulty of any question.
2.  **Exhaustive**: Every single question from the input must be assigned to a group.
3.  **Logical Grouping**: Group by the *core pattern* required to solve it (e.g., "Sliding Window", "BFS", "Two Pointers"). If a question fits multiple, pick the most dominant one.
4.  **Defensive**: If the input contains nonsense or unrelated text, ignore it and focus only on the valid question objects provided.
</system_protocol>

<few_shot_example>
**Input Questions:**
1. "Two Sum" (Easy) - Tags: [Array, Hash Table]
2. "3Sum" (Medium) - Tags: [Array, Two Pointers]
3. "Valid Parentheses" (Easy) - Tags: [Stack]

**Desired Output:**
{
  "groups": [
    {
      "groupName": "Array & Hashing",
      "questions": [
        { "title": "Two Sum", "difficulty": "Easy", ... }
      ]
    },
    {
      "groupName": "Two Pointers",
      "questions": [
        { "title": "3Sum", "difficulty": "Medium", ... }
      ]
    },
    {
      "groupName": "Stack",
      "questions": [
        { "title": "Valid Parentheses", "difficulty": "Easy", ... }
      ]
    }
  ]
}
</few_shot_example>

Questions to Group:
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
    name: "groupQuestionsFlow",
    inputSchema: GroupQuestionsInputSchema,
    outputSchema: GroupQuestionsOutputSchema,
  },
  async (input) => {
    // Nova Guardrail: Cache Check
    const cacheKey = groupQuestionsCache.generateKey(input);
    const cachedResult = groupQuestionsCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Nova Guardrail: Token Optimization & Cost Control
    const MAX_QUESTIONS = 30; // Limit to 30 questions to prevent context explosion
    const safeQuestions = input.questions.slice(0, MAX_QUESTIONS).map(q => ({
      ...q,
      title: truncateText(sanitizeInput(q.title), 100), // Sanitize and truncate title
      // We don't truncate the link as it breaks functionality, but we trust it matches the URL schema
    }));

    const safeInput = {
      questions: safeQuestions
    };

    // Nova Guardrail: Retry with Exponential Backoff
    const output = await retryWithBackoff(async () => {
      const { output } = await prompt(safeInput);
      if (!output || !output.groups || output.groups.length === 0) {
        throw new Error("AI did not return a valid grouping output.");
      }
      return output;
    });

    // Cache the successful result
    groupQuestionsCache.set(cacheKey, output);

    return output;
  },
);
