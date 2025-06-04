"use server";

import type {
    GroupQuestionsInput,
    GroupQuestionsOutput,
} from "@/ai/flows/group-questions";
import { groupQuestions as groupQuestionsFlow } from "@/ai/flows/group-questions";
import type {
    FindSimilarQuestionsInput,
    FindSimilarQuestionsOutput,
} from "@/ai/flows/find-similar-questions-flow";
import { findSimilarQuestions as findSimilarQuestionsFlow } from "@/ai/flows/find-similar-questions-flow";
import type {
    GenerateFlashcardsInput,
    GenerateFlashcardsOutput,
    FlashcardProblemInput,
} from "@/ai/flows/generate-flashcards-flow";
import { generateFlashcardsForCompany as generateFlashcardsFlow } from "@/ai/flows/generate-flashcards-flow";
import type {
    GenerateCompanyStrategyInput,
    GenerateCompanyStrategyOutput,
    CompanyStrategyProblemInput,
    TargetRoleLevel,
} from "@/ai/flows/generate-company-strategy-flow";
import { generateCompanyStrategy as generateCompanyStrategyFlow } from "@/ai/flows/generate-company-strategy-flow";
import type {
    GenerateProblemInsightsInput,
    GenerateProblemInsightsOutput,
} from "@/ai/flows/generate-problem-insights-flow";
import { generateProblemInsights as generateProblemInsightsFlow } from "@/ai/flows/generate-problem-insights-flow";
import type { AIProblemInput, LeetCodeProblem, ChatMessage } from "@/types";
import {
    conductInterviewTurn as conductInterviewTurnFlow,
    type MockInterviewOutput,
} from "@/ai/flows/mock-interview-flow";
import {
    getCompanyById,
    getProblemByCompanySlugAndProblemSlug,
    getProblemsByCompanyFromDb,
} from "@/lib/data";
import { revalidateTag } from "next/cache";

/**
 * Performs AI-powered grouping of coding problems.
 * @param {AIProblemInput[]} problems - An array of problems to be grouped.
 * @returns {Promise<GroupQuestionsOutput | { error: string }>} The grouped questions output or an error object.
 */
export async function performQuestionGrouping(
    problems: AIProblemInput[]
): Promise<GroupQuestionsOutput | { error: string }> {
    try {
        const input: GroupQuestionsInput = {
            questions: problems.map((p) => ({
                ...p,
                link: p.link || `https://example.com/problem/${p.slug}`,
            })),
        };
        const result = await groupQuestionsFlow(input);
        return result;
    } catch (error) {
        console.error("Error in AI question grouping:", error);
        if (error instanceof Error)
            return { error: `Failed to group questions: ${error.message}` };
        return {
            error: "Failed to group questions due to an unknown error. Please try again.",
        };
    }
}

/**
 * Performs AI-powered search for similar coding questions from various platforms.
 * @param {string} currentProblemSlug - The SLUG of the problem for which to find similar ones.
 * @param {string} currentProblemCompanySlug - The slug of the company for the current problem (to fetch its details).
 * @returns {Promise<FindSimilarQuestionsOutput | { error: string }>} The similar questions output or an error object.
 */
export async function performSimilarQuestionSearch(
    currentProblemSlug: string,
    currentProblemCompanySlug: string
): Promise<FindSimilarQuestionsOutput | { error: string }> {
    try {
        const { company, problem: currentProblem } =
            await getProblemByCompanySlugAndProblemSlug(
                currentProblemCompanySlug,
                currentProblemSlug
            );

        if (!currentProblem)
            return {
                error: `Problem with slug ${currentProblemSlug} not found for company ${currentProblemCompanySlug}.`,
            };

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
        console.error("Error in AI similar question search:", error);
        if (error instanceof Error)
            return {
                error: `Failed to find similar questions: ${error.message}`,
            };
        return {
            error: "Failed to find similar questions due to an unknown error.",
        };
    }
}

/**
 * Handles a single turn in the AI-powered mock interview.
 * @param {string} companySlug - The slug of the company.
 * @param {string} problemSlug - The slug of the coding problem for the interview.
 * @param {ChatMessage[]} conversationHistory - The history of messages in the current interview.
 * @param {string} currentUserMessage - The user's latest message or response.
 * @returns {Promise<MockInterviewOutput | { error: string }>} The AI interviewer's response or an error object.
 */
export async function handleInterviewTurn(
    companySlug: string,
    problemSlug: string,
    conversationHistory: ChatMessage[],
    currentUserMessage: string
): Promise<MockInterviewOutput | { error: string }> {
    try {
        if (!companySlug || !problemSlug)
            return {
                error: "Company and Problem slugs are required for the interview.",
            };

        if (!currentUserMessage && conversationHistory.length === 0) {
            currentUserMessage = "Let's start.";
        } else if (!currentUserMessage) {
            return { error: "User message cannot be empty." };
        }

        const { company, problem } =
            await getProblemByCompanySlugAndProblemSlug(
                companySlug,
                problemSlug
            );
        if (!company)
            return { error: `Company with slug ${companySlug} not found.` };
        if (!problem)
            return {
                error: `Problem with slug ${problemSlug} not found for company ${company.name}.`,
            };

        const problemDescriptionForAI = `Title: "${
            problem.title
        }" (Difficulty: ${problem.difficulty}). Tags: ${problem.tags.join(
            ", "
        )}. Problem Link (for context, not for user to click): ${problem.link}`;

        const input = {
            problemTitle: problem.title,
            problemDifficulty: problem.difficulty,
            problemDescription: problemDescriptionForAI,
            problemTags: problem.tags,
            conversationHistory,
            currentUserMessage,
        };
        const result: MockInterviewOutput = await conductInterviewTurnFlow(
            input
        );
        return result;
    } catch (error) {
        console.error("Error in AI interview turn:", error);
        if (error instanceof Error)
            return { error: `AI interview turn failed: ${error.message}` };
        return {
            error: "An unknown error occurred during the interview turn.",
        };
    }
}

/**
 * Generates AI-powered study flashcards for a given company.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<GenerateFlashcardsOutput | { error: string }>} The generated flashcards or an error object.
 */
export async function generateFlashcardsAction(
    companyId: string
): Promise<GenerateFlashcardsOutput | { error: string }> {
    try {
        if (!companyId)
            return { error: "Company ID is required to generate flashcards." };

        const company = await getCompanyById(companyId);
        if (!company)
            return { error: `Company with ID ${companyId} not found.` };

        const problemsResponse = await getProblemsByCompanyFromDb(companyId);
        if (
            !problemsResponse.problems ||
            problemsResponse.problems.length === 0
        ) {
            return { flashcards: [] };
        }

        const problemInputs: FlashcardProblemInput[] =
            problemsResponse.problems.map((p) => ({
                title: p.title,
                difficulty: p.difficulty,
                tags: p.tags,
                lastAskedPeriod: p.lastAskedPeriod,
            }));

        const result = await generateFlashcardsFlow({
            companyName: company.name,
            problems: problemInputs,
        });
        revalidateTag(`company-slug-${company.slug}`);
        revalidateTag(`company-detail-${company.id}`);
        return result;
    } catch (error) {
        console.error("Error in AI flashcard generation:", error);
        if (error instanceof Error)
            return { error: `Failed to generate flashcards: ${error.message}` };
        return {
            error: "An unknown error occurred while generating flashcards.",
        };
    }
}

/**
 * Generates an AI-powered preparation strategy for a given company and target role level.
 * @param {string} companyId - The ID of the company.
 * @param {TargetRoleLevel} [targetRoleLevel] - The target role level (e.g., internship, new_grad).
 * @returns {Promise<GenerateCompanyStrategyOutput | { error: string }>} The generated strategy or an error object.
 */
export async function generateCompanyStrategyAction(
    companyId: string,
    targetRoleLevel?: TargetRoleLevel
): Promise<GenerateCompanyStrategyOutput | { error: string }> {
    try {
        if (!companyId)
            return { error: "Company ID is required to generate a strategy." };

        const company = await getCompanyById(companyId);
        if (!company)
            return { error: `Company with ID ${companyId} not found.` };

        const problemsResponse = await getProblemsByCompanyFromDb(companyId);
        if (
            !problemsResponse.problems ||
            problemsResponse.problems.length === 0
        ) {
            const reason =
                targetRoleLevel && targetRoleLevel !== "general"
                    ? `No problem data available for ${company.name} to tailor a strategy for the ${targetRoleLevel} role.`
                    : `No problem data available for ${company.name} to generate a strategy.`;
            return {
                preparationStrategy: `Cannot generate a detailed strategy for ${company.name} due to lack of problem data. Please add some problems associated with this company first. General advice: Focus on common data structures, algorithms, and practice problem-solving.`,
                focusTopics: [{ topic: "General Problem Solving", reason }],
                todoItems: [
                    {
                        text: "Add problems for this company to enable strategy generation.",
                        isCompleted: false,
                    },
                ],
            };
        }

        const problemInputs: CompanyStrategyProblemInput[] =
            problemsResponse.problems.map((p) => ({
                title: p.title,
                difficulty: p.difficulty,
                tags: p.tags,
                lastAskedPeriod: p.lastAskedPeriod,
            }));

        const result = await generateCompanyStrategyFlow({
            companyName: company.name,
            problems: problemInputs,
            targetRoleLevel,
        });
        revalidateTag(`company-slug-${company.slug}`);
        revalidateTag(`company-detail-${company.id}`);
        return result;
    } catch (error) {
        console.error("Error in AI company strategy generation:", error);
        if (error instanceof Error)
            return { error: `Failed to generate strategy: ${error.message}` };
        return {
            error: "An unknown error occurred while generating the strategy.",
        };
    }
}

/**
 * Generates AI-powered insights (key concepts, common structures/algorithms, hint) for a coding problem.
 * @param {LeetCodeProblem} problem - The problem object (must include companySlug and slug).
 * @returns {Promise<GenerateProblemInsightsOutput | { error: string }>} The generated insights or an error object.
 */
export async function generateProblemInsightsAction(
    problem: LeetCodeProblem
): Promise<GenerateProblemInsightsOutput | { error: string }> {
    try {
        if (!problem || !problem.companySlug || !problem.slug)
            return {
                error: "Problem details including company and problem slugs are required.",
            };

        const problemDescriptionForAI = `Problem Title: "${
            problem.title
        }" (Difficulty: ${problem.difficulty}). Tags: ${problem.tags.join(
            ", "
        )}. Link (for context only): ${
            problem.link
        }. Analyze this problem to provide key concepts, common data structures, common algorithms, and a high-level hint.`;

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
        console.error("Error in AI problem insights generation:", error);
        if (error instanceof Error)
            return { error: `Failed to generate insights: ${error.message}` };
        return {
            error: "An unknown error occurred while generating problem insights.",
        };
    }
  }