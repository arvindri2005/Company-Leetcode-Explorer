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

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import {
  type CompanyStrategyProblemInput as ImportedCompanyStrategyProblemInput,
  type TargetRoleLevel as ImportedTargetRoleLevel,
} from "@/types";

export type CompanyStrategyProblemInput = ImportedCompanyStrategyProblemInput;
export type TargetRoleLevel = ImportedTargetRoleLevel;

const EducationExperienceSchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(2, "Degree is required."),
  major: z.string().min(2, "Major is required."),
  school: z.string().min(2, "School name is required."),
  graduationYear: z
    .string()
    .regex(/^\d{4}$/, "Invalid year format (YYYY).")
    .optional()
    .or(z.literal("")),
  gpa: z.string().optional().or(z.literal("")),
});
export type EducationExperience = z.infer<typeof EducationExperienceSchema>;

const WorkExperienceSchema = z.object({
  id: z.string().optional(),
  jobTitle: z.string().min(2, "Job title is required."),
  companyName: z.string().min(2, "Company name is required."),
  startDate: z
    .string()
    .min(4, "Start date is required (e.g., YYYY or MM/YYYY)."),
  endDate: z.string().optional().or(z.literal("")),
  responsibilities: z
    .string()
    .min(10, "Please describe some responsibilities.")
    .optional()
    .or(z.literal("")),
});
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;

const FocusTopicSchema = z.object({
  topic: z
    .string()
    .describe(
      "A key topic or concept to focus on (e.g., 'Dynamic Programming', 'Graph Traversal', 'System Design Fundamentals for Scalability').",
    ),
  reason: z
    .string()
    .describe(
      "A brief explanation (1-2 sentences) of why this topic is particularly relevant for interviews at this company, based on the provided problem data and target role level if specified.",
    ),
});

const StrategyTodoItemSchema = z.object({
  text: z
    .string()
    .describe("A single, concise, actionable task for the user to complete."),
  isCompleted: z
    .boolean()
    .default(false)
    .describe("Whether the task is completed. Defaults to false."),
});

const CompanyStrategyProblemInputSchema = z.object({
  title: z.string().describe("The title of the coding problem."),
  difficulty: z
    .enum(["Easy", "Medium", "Hard"])
    .describe("The difficulty of the problem."),
  tags: z
    .array(z.string())
    .describe("A list of tags associated with the problem."),
  lastAskedPeriod: z
    .enum([
      "last_30_days",
      "within_3_months",
      "within_6_months",
      "older_than_6_months",
    ])
    .optional()
    .describe("When the problem was last reportedly asked."),
});

const GenerateCompanyStrategyInputSchema = z.object({
  companyName: z
    .string()
    .describe("The name of the company for which to generate the strategy."),
  problems: z
    .array(CompanyStrategyProblemInputSchema)
    .min(1, "At least one problem is required to generate a strategy.")
    .describe(
      "A list of coding problems frequently asked by this company, including their titles, difficulties, tags, and when they were last asked.",
    ),
  targetRoleLevel: z
    .enum(["internship", "new_grad", "experienced", "general"])
    .optional()
    .describe(
      "The experience level the candidate is targeting, e.g., internship, new_grad. If 'general' or not provided, provide general advice.",
    ),
  educationHistory: z
    .array(EducationExperienceSchema)
    .optional()
    .describe(
      "The candidate's educational background. Can be used to tailor advice.",
    ),
  workHistory: z
    .array(WorkExperienceSchema)
    .optional()
    .describe("The candidate's work experience. Can be used to tailor advice."),
});
export type GenerateCompanyStrategyInput = z.infer<
  typeof GenerateCompanyStrategyInputSchema
>;

const GenerateCompanyStrategyOutputSchema = z.object({
  preparationStrategy: z
    .string()
    .describe(
      "A comprehensive, actionable, and personalized preparation strategy for interviewing at this company, formatted in Markdown. This should be at least 3-4 paragraphs and include advice on problem-solving approaches, common pitfalls, and how to leverage the provided problem data for study. Tailor the advice based on the problem difficulties, tags, recency, target role level, and user's background if provided.",
    ),
  focusTopics: z
    .array(FocusTopicSchema)
    .min(3, "Identify at least 3 key focus topics.")
    .max(7, "Identify at most 7 key focus topics.")
    .describe(
      "An array of 3 to 7 key topics or concepts to prioritize, with reasons for each, tailored to the company, target role level, and user background.",
    ),
  todoItems: z
    .array(StrategyTodoItemSchema)
    .min(3, "Generate at least 3 todo items.")
    .max(10, "Generate at most 10 todo items.")
    .describe(
      "An array of 3 to 10 specific, actionable to-do items based on the generated strategy to help the candidate prepare effectively. Each item should be concise.",
    ),
});
export type GenerateCompanyStrategyOutput = z.infer<
  typeof GenerateCompanyStrategyOutputSchema
>;

/**
 * Initiates the AI flow to generate a company-specific interview preparation strategy.
 * @param {GenerateCompanyStrategyInput} input - The company name, list of problems, and optional target role level and user background.
 * @returns {Promise<GenerateCompanyStrategyOutput>} A promise that resolves to the generated strategy, focus topics, and todo list.
 */
export async function generateCompanyStrategy(
  input: GenerateCompanyStrategyInput,
): Promise<GenerateCompanyStrategyOutput> {
  return generateCompanyStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: "generateCompanyStrategyPrompt",
  input: { schema: GenerateCompanyStrategyInputSchema },
  output: { schema: GenerateCompanyStrategyOutputSchema },
  config: {
    maxOutputTokens: 2048,
    temperature: 0.7,
  },
  prompt: `
<system_protocol>
You are "Nova", an elite technical interview coach for top-tier tech companies.
Your specific goal is to analyze *historical interview data* (problems, difficulties, tags) and *candidate background* to create a hyper-personalized, actionable study plan.

**CORE DIRECTIVES:**
1.  **Be Specific, Not Generic**: Avoid platitudes like "study hard" or "be confident". Reference specific problem types, company patterns, and technical concepts.
2.  **Strictly Grounded**: Only recommend topics supported by the provided 'problems' list or standard interview requirements for the 'targetRoleLevel'. Do not hallucinate company secrets or internal interview formats not commonly known.
3.  **Action-Oriented**: Every piece of advice should lead to a clear action (e.g., "Implement X", "Review Y", "Solve Z").
4.  **Defensive**: If the problem list is short or vague, acknowledge this limitation and advise on general patterns for the company type (Big Tech, Startup, Fintech) instead of making up specific trends.
</system_protocol>

<few_shot_example>
**Input:**
- Company: "AlgoHedge"
- Target Role: "experienced"
- Problems:
  - "Order Book Matching" (Hard, Tags: Heap, Map)
  - "Median in Data Stream" (Hard, Tags: Heap)
  - "Valid Parentheses" (Easy, Tags: Stack)
- Background: Senior Backend Engineer at a generic e-commerce firm.

**Desired Output (Excerpt):**
- **Preparation Strategy**: "AlgoHedge is clearly focused on high-frequency data processing, evidenced by the heavy emphasis on Heaps and Stream processing in their 'Hard' problems. Unlike your background in e-commerce which likely prioritized CRUD and consistency, this interview loop will aggressively test *latency* and *memory efficiency*. You must shift your mindset from 'making it work' to 'making it O(1) or O(log n)'. Don't just solve 'Order Book Matching'; implement it with a custom binary heap to demonstrate deep understanding."
- **Focus Topics**:
  - "Priority Queues / Heaps": "Essential for the streaming and order book problems seen in the history."
  - "Low-Level Memory Management": "Critical for the fintech domain; expect questions on garbage collection or memory layout."
</few_shot_example>

You are now generating a strategy for a candidate targeting {{companyName}}.
{{#if targetRoleLevel}}The candidate is targeting an '{{targetRoleLevel}}' role.{{/if}}

{{#if educationHistory.length}}
**Candidate's Educational Background:**
{{#each educationHistory}}
- Degree: {{this.degree}} in {{this.major}} from {{this.school}}{{#if this.graduationYear}}, Graduated: {{this.graduationYear}}{{/if}}{{#if this.gpa}}, GPA: {{this.gpa}}{{/if}}.
{{/each}}
{{/if}}

{{#if workHistory.length}}
**Candidate's Work Experience:**
{{#each workHistory}}
- Role: {{this.jobTitle}} at {{this.companyName}} ({{this.startDate}} - {{#if this.endDate}}{{this.endDate}}{{else}}Present{{/if}}).
  {{#if this.responsibilities}}Responsibilities included: {{this.responsibilities}}{{/if}}
{{/each}}
{{/if}}

**Observed Problem Patterns for {{companyName}}:**
{{#each problems}}
- Problem: "{{this.title}}" ({{this.difficulty}}) - Tags: [{{#if this.tags.length}}{{this.tags}}{{else}}No specific tags{{/if}}]{{#if this.lastAskedPeriod}} - Last Asked: {{this.lastAskedPeriod}}{{/if}}
{{/each}}

**Your Task:**
1.  **Generate a Preparation Strategy (Markdown)**:
    *   Create a comprehensive (3-4 paragraphs min), actionable, and personalized strategy.
    *   **Analyze the Gap**: Compare the candidate's background with the problem list. (e.g., "Your background is in frontend, but {{companyName}} is asking deep graph problems...")
    *   **Tailor by Level**:
        *   'internship': Emphasize potential, communication, and standard DSA.
        *   'new_grad': Solid DSA foundation, ability to optimize.
        *   'experienced': System design, tradeoffs, leadership, and deep domain knowledge.
    *   **Structure**: Use bolding for emphasis.

2.  **Identify Key Focus Topics**:
    *   Identify 3-7 key technical topics.
    *   For each: 'topic' name and 'reason' (Must explicitly link back to the problem list or candidate gap).

3.  **Generate Actionable Todo List ('todoItems')**:
    *   Create 3-10 specific, actionable "todo" items.
    *   Examples: "Implement a Thread-Safe Singleton," "Mock a System Design interview focusing on Scalability."

Return in JSON format: "preparationStrategy", "focusTopics", "todoItems".
`,
});

const generateCompanyStrategyFlow = ai.defineFlow(
  {
    name: "generateCompanyStrategyFlow",
    inputSchema: GenerateCompanyStrategyInputSchema,
    outputSchema: GenerateCompanyStrategyOutputSchema,
  },
  async (input) => {
    // Nova Guardrail: Token Optimization & Cost Control
    // Limit the number of problems sent to the model to prevent context explosion and reduce costs.
    const MAX_PROBLEMS_FOR_CONTEXT = 25;
    const MAX_HISTORY_ITEMS = 5;
    const MAX_RESPONSIBILITIES_LENGTH = 500;

    const safeProblems = input.problems.slice(0, MAX_PROBLEMS_FOR_CONTEXT);

    // Sanitize Work History
    let safeWorkHistory: WorkExperience[] | undefined;
    if (input.workHistory) {
      safeWorkHistory = input.workHistory
        .slice(0, MAX_HISTORY_ITEMS)
        .map((work) => ({
          ...work,
          responsibilities:
            work.responsibilities &&
            work.responsibilities.length > MAX_RESPONSIBILITIES_LENGTH
              ? work.responsibilities.slice(0, MAX_RESPONSIBILITIES_LENGTH) +
                "...(truncated)"
              : work.responsibilities,
        }));
    }

    // Sanitize Education History
    let safeEducationHistory: EducationExperience[] | undefined;
    if (input.educationHistory) {
      safeEducationHistory = input.educationHistory.slice(0, MAX_HISTORY_ITEMS);
    }

    // Create a safe input object with truncated problems and history
    const safeInput = {
      ...input,
      problems: safeProblems,
      workHistory: safeWorkHistory,
      educationHistory: safeEducationHistory,
    };

    const { output } = await prompt(safeInput);
    if (
      !output ||
      !output.preparationStrategy ||
      !output.focusTopics ||
      !output.todoItems
    ) {
      throw new Error(
        "AI failed to generate a complete company-specific strategy. The output was incomplete or invalid.",
      );
    }
    return output;
  },
);
