
'use server';
/**
 * @fileOverview Generates a company-specific interview preparation strategy using AI.
 *
 * This module defines a Genkit flow that takes a company name, a list of LeetCode problems
 * frequently asked by that company, and an optional target role level. It uses an AI model
 * to generate a comprehensive preparation strategy, identify key focus topics, and create
 * an actionable todo list.
 *
 * @exports generateCompanyStrategy - An asynchronous function to initiate strategy generation.
 * @exports GenerateCompanyStrategyInput - The Zod inferred type for the input to the flow.
 * @exports GenerateCompanyStrategyOutput - The Zod inferred type for the output from the flow.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';
import { 
  type CompanyStrategyProblemInput, 
  FocusTopicSchema, // Import schema
  type FocusTopic, 
  type TargetRoleLevel, 
  StrategyTodoItemSchema, // Import schema
  type StrategyTodoItem 
} from '@/types';

const CompanyStrategyProblemInputSchema = z.object({
  title: z.string().describe("The title of the LeetCode problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the problem."),
  tags: z.array(z.string()).describe("A list of tags associated with the problem."),
  lastAskedPeriod: z.enum(['last_30_days', 'within_3_months', 'within_6_months', 'older_than_6_months']).optional().describe("When the problem was last reportedly asked."),
});

const GenerateCompanyStrategyInputSchema = z.object({
  companyName: z.string().describe("The name of the company for which to generate the strategy."),
  problems: z.array(CompanyStrategyProblemInputSchema).min(1, "At least one problem is required to generate a strategy.")
    .describe("A list of LeetCode problems frequently asked by this company, including their titles, difficulties, tags, and when they were last asked."),
  targetRoleLevel: z.enum(['internship', 'new_grad', 'experienced', 'general']).optional()
    .describe("The experience level the candidate is targeting, e.g., internship, new_grad. If 'general' or not provided, provide general advice."),
});
export type GenerateCompanyStrategyInput = z.infer<typeof GenerateCompanyStrategyInputSchema>;

// FocusTopic type is now imported from @/types
// StrategyTodoItem type is now imported from @/types

const GenerateCompanyStrategyOutputSchema = z.object({
  preparationStrategy: z.string()
    .describe("A comprehensive, actionable, and personalized preparation strategy for interviewing at this company, formatted in Markdown. This should be at least 3-4 paragraphs and include advice on problem-solving approaches, common pitfalls, and how to leverage the provided problem data for study. Tailor the advice based on the problem difficulties, tags, recency, and target role level if provided."),
  focusTopics: z.array(FocusTopicSchema) // Use imported schema
    .min(3, "Identify at least 3 key focus topics.")
    .max(7, "Identify at most 7 key focus topics.")
    .describe('An array of 3 to 7 key topics or concepts to prioritize, with reasons for each, tailored to the company and target role level.'),
  todoItems: z.array(StrategyTodoItemSchema) // Use imported schema
    .min(3, "Generate at least 3 todo items.")
    .max(10, "Generate at most 10 todo items.")
    .describe("An array of 3 to 10 specific, actionable to-do items based on the generated strategy to help the candidate prepare effectively. Each item should be concise."),
});
export type GenerateCompanyStrategyOutput = z.infer<typeof GenerateCompanyStrategyOutputSchema>;

/**
 * Initiates the AI flow to generate a company-specific interview preparation strategy.
 * @param {GenerateCompanyStrategyInput} input - The company name, list of problems, and optional target role level.
 * @returns {Promise<GenerateCompanyStrategyOutput>} A promise that resolves to the generated strategy, focus topics, and todo list.
 */
export async function generateCompanyStrategy(input: GenerateCompanyStrategyInput): Promise<GenerateCompanyStrategyOutput> {
  return generateCompanyStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCompanyStrategyPrompt',
  input: {schema: GenerateCompanyStrategyInputSchema},
  output: {schema: GenerateCompanyStrategyOutputSchema},
  prompt: `You are an expert interview coach providing a personalized preparation strategy for a candidate targeting {{companyName}}.
{{#if targetRoleLevel}}The candidate is targeting an '{{targetRoleLevel}}' role at {{companyName}}. Please tailor your advice accordingly.{{/if}}

You have been given a list of LeetCode problems frequently asked by {{companyName}}, along with their difficulty, tags, and how recently they were asked.

LeetCode Problems Data for {{companyName}}:
{{#each problems}}
- Problem: "{{this.title}}" ({{this.difficulty}})
  Tags: [{{#if this.tags.length}}{{this.tags}}{{else}}No specific tags{{/if}}]
  {{#if this.lastAskedPeriod}}Last Asked: {{this.lastAskedPeriod}}{{/if}}
{{/each}}

Your Task:
1.  **Generate a Preparation Strategy**:
    *   Create a comprehensive, actionable, and personalized preparation strategy (3-4 paragraphs minimum) for interviewing at {{companyName}}. This strategy should be formatted in Markdown.
    *   Advise on effective problem-solving approaches based on the patterns observed in the problem data.
    *   Highlight common pitfalls or areas {{companyName}} seems to test frequently.
    *   Suggest how the candidate can use the provided list of problems and their 'lastAskedPeriod' data for targeted study.
    *   Mention the importance of understanding underlying concepts versus rote memorization.
    *   If certain problem difficulties are more prevalent, advise on mastering that level.
    *   **If a 'targetRoleLevel' is provided (and not 'general'), incorporate specific advice relevant to that level.**
        *   For 'internship': Emphasize core DSA, clear articulation, and common behavioral questions. Suggest prioritizing Easy/Medium problems.
        *   For 'new_grad': Highlight solid DSA skills, comfort with Medium problems, exposure to some Hard problems. Mention potential introductory system design and behavioral questions.
        *   For 'experienced': Advice should consider depth in DSA, system design, and leadership/behavioral aspects.

2.  **Identify Key Focus Topics**:
    *   Based on the problem data and 'targetRoleLevel', identify 3 to 7 key technical topics or concepts.
    *   For each topic, provide a 'topic' name and a 'reason' (1-2 sentences explaining its relevance).

3.  **Generate Actionable Todo List ('todoItems')**:
    *   Extract 3 to 10 specific, actionable "todo" items from your strategy and focus topics.
    *   These items should be concise and help the candidate implement the strategy effectively.
    *   Examples: "Solve 5 Medium array problems frequently asked by {{companyName}}.", "Spend 2 hours this week practicing explaining solutions to {{targetRoleLevel}}-appropriate problems out loud.", "Deep dive into [Specific Focus Topic identified for {{companyName}}] using online resources.", "Review common behavioral questions for the {{targetRoleLevel}} role at {{companyName}}."
    *   Populate the 'todoItems' array in the output. Each item in the array should be an object with a 'text' field for the task description, and 'isCompleted' set to false.

Return your response in the specified JSON format, with "preparationStrategy" (Markdown string), "focusTopics" (array of objects), and "todoItems" (array of objects).
Be insightful and provide advice that goes beyond generic study tips. Make it specific to {{companyName}} and the target role level if specified.
`,
});

const generateCompanyStrategyFlow = ai.defineFlow(
  {
    name: 'generateCompanyStrategyFlow',
    inputSchema: GenerateCompanyStrategyInputSchema,
    outputSchema: GenerateCompanyStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.preparationStrategy || !output.focusTopics || !output.todoItems) {
      throw new Error("AI failed to generate a complete company-specific strategy. The output was incomplete or invalid.");
    }
    return output;
  }
);

    