
'use server';
/**
 * @fileOverview Generates a company-specific interview preparation strategy using AI.
 *
 * This module defines a Genkit flow that takes a company name, a list of LeetCode problems
 * frequently asked by that company, and an optional target role level. It uses an AI model
 * to generate a comprehensive preparation strategy and identify key focus topics.
 *
 * @exports generateCompanyStrategy - An asynchronous function to initiate strategy generation.
 * @exports GenerateCompanyStrategyInput - The Zod inferred type for the input to the flow.
 * @exports GenerateCompanyStrategyOutput - The Zod inferred type for the output from the flow.
 * @exports FocusTopic - The Zod inferred type for a focus topic object (re-exported for convenience).
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';
import type { CompanyStrategyProblemInput, FocusTopic, TargetRoleLevel } from '@/types'; // FocusTopic and TargetRoleLevel imported

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

const FocusTopicSchema = z.object({
  topic: z.string().describe("A key topic or concept to focus on (e.g., 'Dynamic Programming', 'Graph Traversal', 'System Design Fundamentals for Scalability')."),
  reason: z.string().describe("A brief explanation (1-2 sentences) of why this topic is particularly relevant for interviews at this company, based on the provided problem data and target role level if specified."),
});
export type { FocusTopic };

const GenerateCompanyStrategyOutputSchema = z.object({
  preparationStrategy: z.string()
    .describe("A comprehensive, actionable, and personalized preparation strategy for interviewing at this company, formatted in Markdown. This should be at least 3-4 paragraphs and include advice on problem-solving approaches, common pitfalls, and how to leverage the provided problem data for study. Tailor the advice based on the problem difficulties, tags, recency, and target role level if provided."),
  focusTopics: z.array(FocusTopicSchema)
    .min(3, "Identify at least 3 key focus topics.")
    .max(7, "Identify at most 7 key focus topics.")
    .describe('An array of 3 to 7 key topics or concepts to prioritize, with reasons for each, tailored to the company and target role level.'),
});
export type GenerateCompanyStrategyOutput = z.infer<typeof GenerateCompanyStrategyOutputSchema>;

/**
 * Initiates the AI flow to generate a company-specific interview preparation strategy.
 * @param {GenerateCompanyStrategyInput} input - The company name, list of problems, and optional target role level.
 * @returns {Promise<GenerateCompanyStrategyOutput>} A promise that resolves to the generated strategy and focus topics.
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
    *   Advise on effective problem-solving approaches based on the patterns observed in the problem data (e.g., if many problems are 'Hard' and involve 'Graphs', suggest focusing on advanced graph algorithms).
    *   Highlight common pitfalls or areas {{companyName}} seems to test frequently.
    *   Suggest how the candidate can use the provided list of problems and their 'lastAskedPeriod' data for targeted study (e.g., prioritizing more recently asked or high-frequency topics).
    *   Mention the importance of understanding underlying concepts versus rote memorization.
    *   If certain problem difficulties are more prevalent (e.g., many Medium problems), advise on mastering that level.
    *   **If a 'targetRoleLevel' is provided (and not 'general'), incorporate specific advice relevant to that level.**
        *   For 'internship': Emphasize core DSA (Arrays, Strings, Linked Lists, Hash Tables, basic Trees/Graphs), clear articulation of thought process even on simpler problems, and common behavioral questions for interns (teamwork, learning, passion for tech). Suggest prioritizing Easy/Medium problems.
        *   For 'new_grad': Highlight expectations for solid DSA skills, comfort with Medium problems, exposure to some Hard problems (especially if aligned with company's frequent tags). Mention potential for introductory system design questions and behavioral questions probing project experiences.
        *   For 'experienced': Advice should consider depth in DSA, system design expectations, and leadership/behavioral aspects relevant to experienced hires at {{companyName}}.

2.  **Identify Key Focus Topics**:
    *   Based on the problem data (tags, difficulties, recency) and the 'targetRoleLevel' (if provided and not 'general'), identify 3 to 7 key technical topics or concepts the candidate should prioritize.
    *   For each topic, provide a 'topic' name (e.g., "Advanced Array Manipulations", "Backtracking Algorithms", "Concurrency Concepts for {{targetRoleLevel}}s") and a 'reason' (1-2 sentences explaining its relevance to {{companyName}} based on the data and role level).

Return your response in the specified JSON format, with "preparationStrategy" (Markdown string) and "focusTopics" (array of objects).
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
    if (!output || !output.preparationStrategy || !output.focusTopics) {
      // Provide a fallback or throw a more specific error
      throw new Error("AI failed to generate a company-specific strategy. The output was incomplete or invalid.");
    }
    return output;
  }
);
