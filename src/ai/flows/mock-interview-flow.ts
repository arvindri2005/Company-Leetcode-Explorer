
'use server';
/**
 * @fileOverview Manages an AI-powered mock coding interview session.
 *
 * This module defines a Genkit flow that handles a single turn in a mock coding interview.
 * It takes the problem details, conversation history, and the user's latest message as input.
 * The AI acts as an interviewer, guiding the user, providing hints, and offering feedback
 * on proposed solutions.
 *
 * @exports conductInterviewTurn - An asynchronous function to process one turn of the interview.
 * @exports MockInterviewInput - The Zod inferred type for the input to the interview turn flow.
 * @exports MockInterviewOutput - The Zod inferred type for the output from the interview turn flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MockInterviewInputSchema = z.object({
  problemTitle: z.string().describe('The title of the LeetCode problem.'),
  problemDifficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty of the problem.'),
  problemDescription: z.string().describe('A concise description of the LeetCode problem, including its core requirements and constraints. This might be derived from the problem link or a summary.'),
  problemTags: z.array(z.string()).describe('Tags associated with the problem, indicating relevant topics or techniques.'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ).describe('The history of the conversation so far. Alternating user and model messages. "model" is the AI interviewer.'),
  currentUserMessage: z.string().describe("The user's latest message, question, code snippet, or attempt."),
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
Your primary goal is to help the user arrive at a correct and efficient solution for the given LeetCode problem through a simulated interview.
Do NOT give away the direct solution too easily. Guide them with Socratic questioning, hints about data structures, algorithms, or edge cases.
If the user provides code, review it constructively. Help them identify bugs or areas for optimization.
If the user is stuck, provide a small, conceptual hint. Ask them to explain their thought process.

Problem Details:
Title: {{problemTitle}}
Difficulty: {{problemDifficulty}}
Tags: {{#if problemTags.length}}{{problemTags}}{{else}}No specific tags{{/if}}
Problem Statement Summary:
{{{problemDescription}}}

Conversation History (where 'model' is you, the AI interviewer):
{{#each conversationHistory}}
{{this.role}}: {{this.content}}
{{/each}}

User's latest message:
user: {{currentUserMessage}}

Your Task as the Interviewer:

First, generate your conversational 'interviewerResponse'. This is always required.

Second, critically assess if the user's current message or their cumulative approach (based on history) indicates they are presenting a solution or are in a phase where detailed feedback would be most beneficial (e.g., they explicitly ask "how is this solution?", "is this correct?", or provide a complete code block).
If it is a solution review phase:
  In addition to your 'interviewerResponse', provide detailed, structured feedback in the 'feedback' object.
  - 'feedback.solutionAssessment': Give an overall assessment (e.g., "Correct and efficient!", "Good approach, handles most cases.", "This approach might have issues with large inputs.").
  - 'feedback.correctnessDetails': Point out specific bugs, missed edge cases, or logical flaws.
  - 'feedback.timeComplexity': Analyze time complexity if possible from the code/explanation.
  - 'feedback.spaceComplexity': Analyze space complexity if possible.
  - 'feedback.alternativeApproaches': Briefly suggest 1-2 alternatives if they are notably different or more optimal.
  - 'feedback.codeQualitySuggestions': Offer brief advice on variable names, clarity, etc., if there's room for improvement.
  Be concise and constructive in each feedback field. If a field isn't relevant (e.g., no code quality issues), omit it or leave it empty.
If it is NOT a solution review phase (i.e., the user is still exploring, asking for hints, clarifying the problem):
  Focus on guiding the user. Your 'interviewerResponse' should be Socratic, provide hints, or ask clarifying questions.
  In this case, the 'feedback' object can be omitted entirely, or all its fields can be empty/undefined.

Third, if the user's message presents an idea, a specific approach, a code snippet, or a significant clarification of their thought process (and it's not just a simple "yes" or "I don't know"), consider generating 1-2 brief 'suggestedFollowUps'. These should be concise questions or points that probe deeper into their approach, consider edge cases, or touch upon optimizations. For example: "How would this handle duplicate numbers in the input?", "What's the time complexity of that helper function?", or "Could a different data structure be more efficient here?". Populate the 'suggestedFollowUps' array with these (max 2). If no specific follow-ups come to mind or the user's message is too brief, omit this field or leave the array empty.

General Interviewer Guidelines:
1.  If the conversation history is empty and the user's message is a greeting (e.g., "Let's start", "I'm ready"), your 'interviewerResponse' should begin by briefly confirming the problem and asking how they'd like to approach it. For example: "Great! We're looking at '{{problemTitle}}'. How would you like to begin thinking about this problem? What are your initial thoughts or observations?"
2.  If the user is asking for clarification on the problem, provide it clearly in 'interviewerResponse'.
3.  If the user is explaining their approach: Ask follow-up questions about edge cases, complexity in 'interviewerResponse'.
4.  If the user provides code (as text): Review it constructively.
5.  If the user is stuck and explicitly asks for a hint: Provide a small, conceptual hint in 'interviewerResponse'.
6.  Maintain a professional, patient, and encouraging tone throughout.
7.  Keep your 'interviewerResponse' focused and not excessively long. Format any code examples or pseudo-code using markdown code blocks.

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
    if (!output || !output.interviewerResponse) { // Check for at least interviewerResponse
      // Provide a fallback or throw a more specific error
      throw new Error("AI did not return a valid output for the interview turn. Input was: " + JSON.stringify(input));
    }
    return output;
  }
);
