
'use server';
/**
 * @fileOverview Manages an AI-powered mock coding interview session.
 *
 * This module defines a Genkit flow that handles a single turn in a mock coding interview.
 * It takes the problem details, conversation history, the user's latest message, 
 * and optionally the user's educational and work background as input.
 * The AI acts as an interviewer, guiding the user, providing hints, and offering feedback
 * on proposed solutions, potentially tailoring questions or hints based on user background.
 *
 * @exports conductInterviewTurn - An asynchronous function to process one turn of the interview.
 * @exports MockInterviewInput - The Zod inferred type for the input to the interview turn flow.
 * @exports MockInterviewOutput - The Zod inferred type for the output from the interview turn flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { EducationExperienceSchema, WorkExperienceSchema, type EducationExperience, type WorkExperience } from '@/types'; // Import schemas

const MockInterviewInputSchema = z.object({
  problemTitle: z.string().describe('The title of the coding problem.'),
  problemDifficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty of the problem.'),
  problemDescription: z.string().describe('A concise description of the coding problem, including its core requirements and constraints. This might be derived from the problem link or a summary.'),
  problemTags: z.array(z.string()).describe('Tags associated with the problem, indicating relevant topics or techniques.'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ).describe('The history of the conversation so far. Alternating user and model messages. "model" is the AI interviewer.'),
  currentUserMessage: z.string().describe("The user's latest message, question, code snippet, or attempt."),
  educationHistory: z.array(EducationExperienceSchema).optional()
    .describe("The candidate's educational background. Can be used by the AI to tailor questions or hints if relevant."),
  workHistory: z.array(WorkExperienceSchema).optional()
    .describe("The candidate's work experience. Can be used by the AI to tailor questions or hints if relevant."),
});
export type MockInterviewInput = z.infer<typeof MockInterviewInputSchema>;

const FeedbackSchema = z.object({
  solutionAssessment: z.string().optional().describe("Overall assessment of the user's solution if they submitted one. E.g., Correct, Almost Correct (with details), Incorrect approach. Be concise but clear."),
  correctnessDetails: z.string().optional().describe("Specific details on correctness, bugs, or edge cases missed. Only provide if there are noteworthy points. Be constructive."),
  timeComplexity: z.string().optional().describe("Analysis of the time complexity of the user's solution (e.g., O(n), O(n log n)). Provide if identifiable from code or clear approach."),
  spaceComplexity: z.string().optional().describe("Analysis of the space complexity of the user's solution (e.g., O(1), O(n)). Provide if identifiable."),
  alternativeApproaches: z.array(z.string()).optional().describe("Brief suggestions for 1-2 alternative or more optimal approaches, if applicable and distinct from the user's method."),
  codeQualitySuggestions: z.string().optional().describe("Brief suggestions for improving code clarity, style, or best practices (e.g., variable naming, modularity). Only if significant."),
}).describe("Structured feedback on the user's solution attempt. Provided when the AI deems it a review phase.");

const MockInterviewOutputSchema = z.object({
  interviewerResponse: z.string().describe("The AI interviewer's conversational response to the user. This should be helpful, guiding, and avoid giving direct solutions unless the user is completely stuck and has asked for a more direct hint, or if they are submitting a final solution for review."),
  feedback: FeedbackSchema.optional(),
  suggestedFollowUps: z.array(z.string())
    .max(2, "Provide at most 2 follow-up questions/points.")
    .optional()
    .describe("A list of 1-2 concise follow-up questions or points for the user to consider based on their current message. These are for the user to think about or for the AI to potentially use in a later turn. Generate these if the user has proposed an approach, shared code, or made a significant statement."),
});
export type MockInterviewOutput = z.infer<typeof MockInterviewOutputSchema>;

/**
 * Processes a single turn in the mock interview.
 * @param {MockInterviewInput} input - The current state of the interview and user's message.
 * @returns {Promise<MockInterviewOutput>} A promise that resolves to the AI interviewer's response, potentially including feedback and follow-up questions.
 */
export async function conductInterviewTurn(input: MockInterviewInput): Promise<MockInterviewOutput> {
  return mockInterviewFlow(input);
}

const interviewPrompt = ai.definePrompt({
  name: 'mockInterviewPrompt',
  input: { schema: MockInterviewInputSchema },
  output: { schema: MockInterviewOutputSchema },
  prompt: `You are an expert, friendly, and encouraging coding interviewer.
Your primary goal is to help the user arrive at a correct and efficient solution for the given coding problem through a simulated interview.
Do NOT give away the direct solution too easily. Guide them with Socratic questioning, hints about data structures, algorithms, or edge cases.
If the user provides code, review it constructively. Help them identify bugs or areas for optimization.
If the user is stuck, provide a small, conceptual hint. Ask them to explain their thought process.

Problem Details:
Title: {{problemTitle}}
Difficulty: {{problemDifficulty}}
Tags: {{#if problemTags.length}}{{problemTags}}{{else}}No specific tags{{/if}}
Problem Statement Summary:
{{{problemDescription}}}

{{#if educationHistory.length}}
Candidate's Educational Background (for context, do not directly quiz on this unless it's highly relevant to their approach or claims):
{{#each educationHistory}}
- Degree: {{this.degree}} in {{this.major}} from {{this.school}}{{#if this.graduationYear}}, Graduated: {{this.graduationYear}}{{/if}}.
{{/each}}
{{/if}}

{{#if workHistory.length}}
Candidate's Work Experience (for context, do not directly quiz on this unless it's highly relevant to their approach or claims):
{{#each workHistory}}
- Role: {{this.jobTitle}} at {{this.companyName}} ({{this.startDate}} - {{#if this.endDate}}{{this.endDate}}{{else}}Present{{/if}}).
{{/each}}
{{/if}}

Conversation History (where 'model' is you, the AI interviewer):
{{#each conversationHistory}}
{{this.role}}: {{this.content}}
{{/each}}

User's latest message:
user: {{currentUserMessage}}

Your Task as the Interviewer:

First, generate your conversational 'interviewerResponse'. This is always required.
If the user's background (education/work experience) is provided and seems relevant to the problem or their explanation (e.g., they mention experience with a specific technology also used in their education), you can subtly tailor your questions or hints. For example, "Given your experience with X, how might that apply here?" or "Your background in Y might give you a unique perspective on this part of the problem." Use this sparingly and naturally.

Second, critically assess if the user's current message or their cumulative approach (based on history) indicates they are presenting a solution or are in a phase where detailed feedback would be most beneficial.
If it is a solution review phase:
  Provide detailed, structured feedback in the 'feedback' object.
If it is NOT a solution review phase:
  Focus on guiding the user. Your 'interviewerResponse' should be Socratic. The 'feedback' object can be omitted.

Third, if the user's message presents an idea or significant clarification, consider generating 1-2 brief 'suggestedFollowUps'.

General Interviewer Guidelines:
1.  If conversation history is empty and user message is a greeting, start by confirming the problem and asking for their initial thoughts.
2.  If user asks for clarification, provide it.
3.  If user explains approach: Ask about edge cases, complexity.
4.  If user provides code: Review constructively.
5.  If user is stuck and asks for a hint: Provide a small, conceptual hint.
6.  Maintain professional, patient, encouraging tone.
7.  Keep 'interviewerResponse' focused. Format code/pseudo-code in markdown.

Generate only the JSON output according to the MockInterviewOutputSchema.
`,
});

const mockInterviewFlow = ai.defineFlow(
  {
    name: 'mockInterviewFlow',
    inputSchema: MockInterviewInputSchema,
    outputSchema: MockInterviewOutputSchema,
  },
  async (input) => {
    const { output } = await interviewPrompt(input);
    if (!output || !output.interviewerResponse) { 
      throw new Error("AI did not return a valid output for the interview turn. Input was: " + JSON.stringify(input));
    }
    return output;
  }
);
