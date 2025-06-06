
'use server';
/**
 * @fileOverview Generates a company-specific interview preparation strategy using AI.
 *
 * This module defines a Genkit flow that takes a company name, a list of coding problems
 * frequently asked by that company, and an optional target role level. It uses an AI model
 * to generate a comprehensive preparation strategy, identify key focus topics, and create
 * an actionable todo list. It can optionally consider the user's educational and work background.
 *
 * @exports generateCompanyStrategy - An asynchronous function to initiate strategy generation.
 * @exports GenerateCompanyStrategyInput - The Zod inferred type for the input to the flow.
 * @exports GenerateCompanyStrategyOutput - The Zod inferred type for the output from the flow.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';
import { 
  type CompanyStrategyProblemInput, 
  FocusTopicSchema, 
  type FocusTopic, 
  type TargetRoleLevel, 
  StrategyTodoItemSchema, 
  type StrategyTodoItem,
  EducationExperienceSchema, // Import Education schema
  type EducationExperience,
  WorkExperienceSchema, // Import Work schema
  type WorkExperience
} from '@/types';

const CompanyStrategyProblemInputSchema = z.object({
  title: z.string().describe("The title of the coding problem."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty of the problem."),
  tags: z.array(z.string()).describe("A list of tags associated with the problem."),
  lastAskedPeriod: z.enum(['last_30_days', 'within_3_months', 'within_6_months', 'older_than_6_months']).optional().describe("When the problem was last reportedly asked."),
});

const GenerateCompanyStrategyInputSchema = z.object({
  companyName: z.string().describe("The name of the company for which to generate the strategy."),
  problems: z.array(CompanyStrategyProblemInputSchema).min(1, "At least one problem is required to generate a strategy.")
    .describe("A list of coding problems frequently asked by this company, including their titles, difficulties, tags, and when they were last asked."),
  targetRoleLevel: z.enum(['internship', 'new_grad', 'experienced', 'general']).optional()
    .describe("The experience level the candidate is targeting, e.g., internship, new_grad. If 'general' or not provided, provide general advice."),
  educationHistory: z.array(EducationExperienceSchema).optional()
    .describe("The candidate's educational background. Can be used to tailor advice."),
  workHistory: z.array(WorkExperienceSchema).optional()
    .describe("The candidate's work experience. Can be used to tailor advice."),
});
export type GenerateCompanyStrategyInput = z.infer<typeof GenerateCompanyStrategyInputSchema>;

const GenerateCompanyStrategyOutputSchema = z.object({
  preparationStrategy: z.string()
    .describe("A comprehensive, actionable, and personalized preparation strategy for interviewing at this company, formatted in Markdown. This should be at least 3-4 paragraphs and include advice on problem-solving approaches, common pitfalls, and how to leverage the provided problem data for study. Tailor the advice based on the problem difficulties, tags, recency, target role level, and user's background if provided."),
  focusTopics: z.array(FocusTopicSchema) 
    .min(3, "Identify at least 3 key focus topics.")
    .max(7, "Identify at most 7 key focus topics.")
    .describe('An array of 3 to 7 key topics or concepts to prioritize, with reasons for each, tailored to the company, target role level, and user background.'),
  todoItems: z.array(StrategyTodoItemSchema) 
    .min(3, "Generate at least 3 todo items.")
    .max(10, "Generate at most 10 todo items.")
    .describe("An array of 3 to 10 specific, actionable to-do items based on the generated strategy to help the candidate prepare effectively. Each item should be concise."),
});
export type GenerateCompanyStrategyOutput = z.infer<typeof GenerateCompanyStrategyOutputSchema>;

/**
 * Initiates the AI flow to generate a company-specific interview preparation strategy.
 * @param {GenerateCompanyStrategyInput} input - The company name, list of problems, and optional target role level and user background.
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
{{#if targetRoleLevel}}The candidate is targeting an '{{targetRoleLevel}}' role.{{/if}}

{{#if educationHistory.length}}
Candidate's Educational Background:
{{#each educationHistory}}
- Degree: {{this.degree}} in {{this.major}} from {{this.school}}{{#if this.graduationYear}}, Graduated: {{this.graduationYear}}{{/if}}{{#if this.gpa}}, GPA: {{this.gpa}}{{/if}}.
{{/each}}
{{/if}}

{{#if workHistory.length}}
Candidate's Work Experience:
{{#each workHistory}}
- Role: {{this.jobTitle}} at {{this.companyName}} ({{this.startDate}} - {{#if this.endDate}}{{this.endDate}}{{else}}Present{{/if}}).
  {{#if this.responsibilities}}Responsibilities included: {{this.responsibilities}}{{/if}}
{{/each}}
{{/if}}

You have been given a list of coding problems frequently asked by {{companyName}}:
{{#each problems}}
- Problem: "{{this.title}}" ({{this.difficulty}}) - Tags: [{{#if this.tags.length}}{{this.tags}}{{else}}No specific tags{{/if}}]{{#if this.lastAskedPeriod}} - Last Asked: {{this.lastAskedPeriod}}{{/if}}
{{/each}}

Your Task:
1.  **Generate a Preparation Strategy (Markdown)**:
    *   Create a comprehensive (3-4 paragraphs min), actionable, and personalized strategy.
    *   Advise on problem-solving approaches based on observed patterns in the problem data.
    *   Highlight common pitfalls or areas {{companyName}} frequently tests.
    *   Suggest how to use the problem list and 'lastAskedPeriod' data for study.
    *   **If 'targetRoleLevel' (and not 'general') or user's education/work history are provided, tailor advice accordingly.**
        *   'internship': Emphasize core DSA, clear articulation. Suggest prioritizing Easy/Medium problems.
        *   'new_grad': Solid DSA, comfort with Medium problems, some Hard. Potential introductory system design.
        *   'experienced': Depth in DSA, system design, leadership. Consider how their work history might align or identify gaps.
    *   If the candidate's background suggests specific strengths/weaknesses (e.g., strong academic background but little practical experience, or vice-versa), gently weave that into the advice.

2.  **Identify Key Focus Topics**:
    *   Based on problem data, target role, and user background, identify 3-7 key technical topics.
    *   For each: 'topic' name and 'reason' (1-2 sentences explaining relevance).

3.  **Generate Actionable Todo List ('todoItems')**:
    *   Create 3-10 specific, actionable "todo" items from your strategy.
    *   Examples: "Solve 5 Medium array problems for {{companyName}}.", "Deep dive into [Specific Topic for {{companyName}}] based on your {{#if educationHistory.length}}degree in {{educationHistory.0.major}}{{else}}background{{/if}}."
    *   Each item: 'text' and 'isCompleted: false'.

Return in JSON format: "preparationStrategy", "focusTopics", "todoItems".
Be insightful, specific to {{companyName}}, and adapt to provided candidate details.
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
