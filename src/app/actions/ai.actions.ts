
/**
 * @fileoverview Server-side actions that leverage AI-powered Genkit flows.
 *
 * This module provides a set of Next.js server actions that serve as wrappers around
 * various Genkit flows defined in the `@/ai/flows` directory. These actions handle
 * tasks such as grouping questions, finding similar problems, conducting mock interviews,
 * and generating study materials. They are responsible for fetching necessary data,
 * formatting the input for the AI flows, calling the flows, and handling the results,
 * including error management and cache revalidation.
 */
'use server';

import type { GroupQuestionsInput, GroupQuestionsOutput } from '@/ai/flows/group-questions';
import { groupQuestions as groupQuestionsFlow } from '@/ai/flows/group-questions';
import type { FindSimilarQuestionsInput, FindSimilarQuestionsOutput } from '@/ai/flows/find-similar-questions-flow';
import { findSimilarQuestions as findSimilarQuestionsFlow } from '@/ai/flows/find-similar-questions-flow';
import type { GenerateFlashcardsInput, GenerateFlashcardsOutput, FlashcardProblemInput } from '@/ai/flows/generate-flashcards-flow';
import { generateFlashcardsForCompany as generateFlashcardsFlow } from '@/ai/flows/generate-flashcards-flow';
import type { GenerateCompanyStrategyInput, GenerateCompanyStrategyOutput, CompanyStrategyProblemInput, TargetRoleLevel, EducationExperience, WorkExperience } from '@/ai/flows/generate-company-strategy-flow'; // Added EducationExperience, WorkExperience
import { generateCompanyStrategy as generateCompanyStrategyFlow } from '@/ai/flows/generate-company-strategy-flow';
import type { GenerateProblemInsightsInput, GenerateProblemInsightsOutput } from '@/ai/flows/generate-problem-insights-flow';
import { generateProblemInsights as generateProblemInsightsFlow } from '@/ai/flows/generate-problem-insights-flow';
import type { AIProblemInput, LeetCodeProblem, ChatMessage } from '@/types';
import { conductInterviewTurn as conductInterviewTurnFlow, type MockInterviewOutput } from '@/ai/flows/mock-interview-flow';
import { getCompanyById, getProblemByCompanySlugAndProblemSlug, getProblemsByCompanyFromDb } from '@/lib/data';
import { getUserEducationAction, getUserWorkExperienceAction } from './user.actions'; // Import new actions
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/firebase'; // For current user ID

/**
 * Performs AI-powered grouping of coding problems into logical categories.
 *
 * This action takes an array of problem details, formats them for the `groupQuestionsFlow`,
 * and invokes the AI to determine thematic groups based on problem characteristics like
 * tags and titles.
 *
 * @param {AIProblemInput[]} problems - An array of problem objects to be grouped.
 * @returns {Promise<GroupQuestionsOutput | { error: string }>} A promise that resolves to the
 * structured output from the AI, containing named groups of questions, or an error object
 * if the operation fails.
 */
export async function performQuestionGrouping(
  problems: AIProblemInput[]
): Promise<GroupQuestionsOutput | { error: string }> {
  try {
    const input: GroupQuestionsInput = { questions: problems.map(p => ({...p, link: p.link || `https://example.com/problem/${p.slug}`})) };
    const result = await groupQuestionsFlow(input);
    return result;
  } catch (error) {
    console.error('Error in AI question grouping:', error);
    if (error instanceof Error) return { error: `Failed to group questions: ${error.message}` };
    return { error: 'Failed to group questions due to an unknown error. Please try again.' };
  }
}

/**
 * Finds coding problems from various online platforms that are conceptually similar to a given problem.
 *
 * This action retrieves the details of a specified "current" problem from the database,
 * then invokes an AI flow to search for up to 5 similar problems on platforms like
 * LeetCode, GeeksforGeeks, etc.
 *
 * @param {string} currentProblemSlug - The slug of the problem for which to find similar ones.
 * @param {string} currentProblemCompanySlug - The slug of the company associated with the current problem,
 * needed to fetch the problem's full details.
 * @returns {Promise<FindSimilarQuestionsOutput | { error: string }>} A promise that resolves to an
 * object containing an array of similar problems, each with details and a reason for similarity,
 * or an error object if the operation fails.
 */
export async function performSimilarQuestionSearch(
  currentProblemSlug: string,
  currentProblemCompanySlug: string
): Promise<FindSimilarQuestionsOutput | { error: string }> {
  try {
    const { company, problem: currentProblem } = await getProblemByCompanySlugAndProblemSlug(currentProblemCompanySlug, currentProblemSlug);

    if (!currentProblem) return { error: `Problem with slug ${currentProblemSlug} not found for company ${currentProblemCompanySlug}.` };

    const input: FindSimilarQuestionsInput = {
      currentProblem: {
        title: currentProblem.title,
        difficulty: currentProblem.difficulty,
        tags: currentProblem.tags,
        slug: currentProblem.slug,
      },
    };
    return await findSimilarQuestionsFlow(input);
  } catch (error) {
    console.error('Error in AI similar question search:', error);
    if (error instanceof Error) return { error: `Failed to find similar questions: ${error.message}` };
    return { error: 'Failed to find similar questions due to an unknown error.' };
  }
}

/**
 * Manages a single conversational turn in an AI-powered mock coding interview.
 *
 * This action orchestrates one round of interaction between the user and the AI interviewer.
 * It fetches problem details, retrieves the user's optional education and work history for context,
 * and then calls the `conductInterviewTurnFlow` to generate the AI's next response based on
 * the conversation history and the user's latest message.
 *
 * @param {string} companySlug - The slug of the company associated with the interview problem.
 * @param {string} problemSlug - The slug of the coding problem being discussed.
 * @param {ChatMessage[]} conversationHistory - An array of previous messages in the interview,
 * maintaining the conversational context.
 * @param {string} currentUserMessage - The user's latest message, question, or code snippet.
 * @returns {Promise<MockInterviewOutput | { error: string }>} A promise that resolves to the AI
 * interviewer's response, which may include conversational text, structured feedback, and
 * suggested follow-up questions, or an error object if the turn fails.
 */
export async function handleInterviewTurn(
  companySlug: string, problemSlug: string, conversationHistory: ChatMessage[], currentUserMessage: string
): Promise<MockInterviewOutput | { error: string }> {
  try {
    if (!companySlug || !problemSlug) return { error: 'Company and Problem slugs are required for the interview.' };

    if (!currentUserMessage && conversationHistory.length === 0) {
      currentUserMessage = "Let's start.";
    } else if (!currentUserMessage) {
      return { error: 'User message cannot be empty.' };
    }

    const { company, problem } = await getProblemByCompanySlugAndProblemSlug(companySlug, problemSlug);
    if (!company) return { error: `Company with slug ${companySlug} not found.`};
    if (!problem) return { error: `Problem with slug ${problemSlug} not found for company ${company.name}.` };

    const problemDescriptionForAI = `Title: "${problem.title}" (Difficulty: ${problem.difficulty}). Tags: ${problem.tags.join(', ')}. Problem Link (for context, not for user to click): ${problem.link}`;
    
    let educationHistory: EducationExperience[] | undefined = undefined;
    let workHistory: WorkExperience[] | undefined = undefined;
    const firebaseUser = auth.currentUser; // This might be null if called from non-auth context, handle gracefully

    if (firebaseUser?.uid) {
        const eduResult = await getUserEducationAction(firebaseUser.uid);
        if (Array.isArray(eduResult)) educationHistory = eduResult;
        
        const workResult = await getUserWorkExperienceAction(firebaseUser.uid);
        if (Array.isArray(workResult)) workHistory = workResult;
    }

    const input = {
      problemTitle: problem.title,
      problemDifficulty: problem.difficulty,
      problemDescription: problemDescriptionForAI,
      problemTags: problem.tags,
      conversationHistory,
      currentUserMessage,
      educationHistory, // Pass to flow
      workHistory,      // Pass to flow
    };
    const result: MockInterviewOutput = await conductInterviewTurnFlow(input);
    return result;
  } catch (error) {
    console.error('Error in AI interview turn:', error);
    if (error instanceof Error) return { error: `AI interview turn failed: ${error.message}` };
    return { error: 'An unknown error occurred during the interview turn.' };
  }
}

/**
 * Generates a set of AI-powered study flashcards for a specific company.
 *
 * This action fetches details about a company and all its associated coding problems.
 * It then invokes the `generateFlashcardsFlow` to create 3 to 10 flashcards
 * that summarize key concepts, patterns, and insights from the problems. Finally,
 * it triggers a cache revalidation for the relevant company page.
 *
 * @param {string} companyId - The unique identifier of the company for which to generate flashcards.
 * @returns {Promise<GenerateFlashcardsOutput | { error: string }>} A promise that resolves to an
 * object containing an array of generated flashcards, or an error object if the process fails.
 * If no problems are found, it returns an empty array of flashcards.
 */
export async function generateFlashcardsAction(companyId: string): Promise<GenerateFlashcardsOutput | { error: string }> {
  try {
    if (!companyId) return { error: 'Company ID is required to generate flashcards.' };

    const company = await getCompanyById(companyId); 
    if (!company) return { error: `Company with ID ${companyId} not found.` };

    const problemsResponse = await getProblemsByCompanyFromDb(companyId);
    if (!problemsResponse.problems || problemsResponse.problems.length === 0) {
      return { flashcards: [] };
    }

    const problemInputs: FlashcardProblemInput[] = problemsResponse.problems.map(p => ({
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      lastAskedPeriod: p.lastAskedPeriod
    }));

    const result = await generateFlashcardsFlow({ companyName: company.name, problems: problemInputs });
    revalidateTag(`company-slug-${company.slug}`); 
    revalidateTag(`company-detail-${company.id}`);
    return result;
  } catch (error) {
    console.error('Error in AI flashcard generation:', error);
    if (error instanceof Error) return { error: `Failed to generate flashcards: ${error.message}` };
    return { error: 'An unknown error occurred while generating flashcards.' };
  }
}

/**
 * Generates a personalized, AI-powered interview preparation strategy for a specific company.
 *
 * This action gathers all coding problems associated with a company and, optionally, the user's
 * target role level and their education/work history. It then invokes the `generateCompanyStrategyFlow`
 * to produce a comprehensive markdown strategy, a list of key topics to focus on, and an
 * actionable to-do list. It triggers cache revalidation for the company page upon completion.
 *
 * @param {string} companyId - The unique identifier of the company.
 * @param {TargetRoleLevel} [targetRoleLevel] - Optional. The user's target role level (e.g.,
 * 'internship', 'new_grad', 'experienced'), which helps tailor the strategy.
 * @returns {Promise<GenerateCompanyStrategyOutput | { error: string }>} A promise that resolves to the
 * structured strategy output, or an error object. If no problem data is available, it returns
 * a default message.
 */
export async function generateCompanyStrategyAction(
  companyId: string, targetRoleLevel?: TargetRoleLevel
): Promise<GenerateCompanyStrategyOutput | { error: string }> {
  try {
    if (!companyId) return { error: 'Company ID is required to generate a strategy.' };

    const company = await getCompanyById(companyId);
    if (!company) return { error: `Company with ID ${companyId} not found.` };

    const problemsResponse = await getProblemsByCompanyFromDb(companyId);
    if (!problemsResponse.problems || problemsResponse.problems.length === 0) {
      const reason = targetRoleLevel && targetRoleLevel !== 'general'
        ? `No problem data available for ${company.name} to tailor a strategy for the ${targetRoleLevel} role.`
        : `No problem data available for ${company.name} to generate a strategy.`;
      return {
        preparationStrategy: `Cannot generate a detailed strategy for ${company.name} due to lack of problem data. Please add some problems associated with this company first. General advice: Focus on common data structures, algorithms, and practice problem-solving.`,
        focusTopics: [{ topic: "General Problem Solving", reason }],
        todoItems: [{ text: "Add problems for this company to enable strategy generation.", isCompleted: false }]
      };
    }

    const problemInputs: CompanyStrategyProblemInput[] = problemsResponse.problems.map(p => ({
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      lastAskedPeriod: p.lastAskedPeriod
    }));

    let educationHistory: EducationExperience[] | undefined = undefined;
    let workHistory: WorkExperience[] | undefined = undefined;
    const firebaseUser = auth.currentUser; 

    if (firebaseUser?.uid) {
        const eduResult = await getUserEducationAction(firebaseUser.uid);
        if (Array.isArray(eduResult)) educationHistory = eduResult;
        
        const workResult = await getUserWorkExperienceAction(firebaseUser.uid);
        if (Array.isArray(workResult)) workHistory = workResult;
    }

    const result = await generateCompanyStrategyFlow({
      companyName: company.name,
      problems: problemInputs,
      targetRoleLevel,
      educationHistory,
      workHistory,
    });
    revalidateTag(`company-slug-${company.slug}`); 
    revalidateTag(`company-detail-${company.id}`);
    return result;
  } catch (error) {
    console.error('Error in AI company strategy generation:', error);
    if (error instanceof Error) return { error: `Failed to generate strategy: ${error.message}` };
    return { error: 'An unknown error occurred while generating the strategy.' };
  }
}

/**
 * Generates AI-powered insights for a specific coding problem.
 *
 * This action takes a problem's details and invokes the `generateProblemInsightsFlow`
 * to identify key concepts, common data structures, relevant algorithms, and a high-level
 * conceptual hint. This helps users understand the problem's core challenges without
 * revealing the solution. It triggers cache revalidation for the relevant problem and
 * company pages.
 *
 * @param {LeetCodeProblem} problem - The full problem object, which must include `companySlug` and `slug`.
 * @returns {Promise<GenerateProblemInsightsOutput | { error: string }>} A promise that resolves to the
 * structured insights output, including concepts, data structures, algorithms, and a hint,
 * or an error object if the operation fails.
 */
export async function generateProblemInsightsAction(
  problem: LeetCodeProblem
): Promise<GenerateProblemInsightsOutput | { error: string }> {
  try {
    if (!problem || !problem.companySlug || !problem.slug) return { error: 'Problem details including company and problem slugs are required.' };

    const problemDescriptionForAI = `Problem Title: "${problem.title}" (Difficulty: ${problem.difficulty}). Tags: ${problem.tags.join(', ')}. Link (for context only): ${problem.link}. Analyze this problem to provide key concepts, common data structures, common algorithms, and a high-level hint.`;

    const input: GenerateProblemInsightsInput = {
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags,
      problemDescription: problemDescriptionForAI,
    };
    const result = await generateProblemInsightsFlow(input);
    revalidateTag(`problem-slug-${problem.slug}`); 
    revalidateTag(`company-slug-${problem.companySlug}`); 
    revalidateTag(`problem-detail-${problem.id}`);
    revalidateTag(`company-detail-${problem.companyId}`);
    return result;
  } catch (error) {
    console.error('Error in AI problem insights generation:', error);
    if (error instanceof Error) return { error: `Failed to generate insights: ${error.message}` };
    return { error: 'An unknown error occurred while generating problem insights.' };
  }
}
