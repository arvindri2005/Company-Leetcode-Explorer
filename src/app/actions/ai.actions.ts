/**
 * @fileoverview Server-side actions that leverage AI-powered Genkit flows.
 *
 * This module provides a set of Next.js server actions that serve as wrappers around
 * various Genkit flows defined in the `@/ai/flows` directory. These actions handle
 * tasks such as grouping questions, finding similar problems, conducting mock interviews,
 * and generating study materials. They are responsible for fetching necessary data,
 * formatting the input for the AI flows, calling the flows, and handling the results,
 * including error management and cache revalidation.
 *
 * SENTINEL SECURITY WARNING:
 * These actions utilize the Genkit AI service which incurs cost (tokens/latency).
 * As currently implemented, they are public server actions and do not strictly enforce
 * authentication or rate limiting on the server side (relying on client-side access controls).
 * This presents a potential Denial of Wallet / Resource Exhaustion risk.
 * Future improvements should implement server-side rate limiting or strict auth checks.
 *
 * Defensive measures implemented:
 * - Strict input length validation (e.g., MAX_PROBLEMS_FOR_GROUPING).
 * - Cost guardrails in Genkit flows (maxOutputTokens).
 */
"use server";

import { revalidateTag } from "next/cache";

import { companyService } from "@/features/companies/services/company.service"; // needed for revalidate lookup
import type { FindSimilarQuestionsOutput } from "@/lib/ai/flows/find-similar-questions-flow";
import type {
  GenerateCompanyStrategyOutput,
  TargetRoleLevel,
} from "@/lib/ai/flows/generate-company-strategy-flow"; 
import type { GenerateFlashcardsOutput } from "@/lib/ai/flows/generate-flashcards-flow";
import type { GenerateProblemInsightsOutput } from "@/lib/ai/flows/generate-problem-insights-flow";
import type { GroupQuestionsOutput } from "@/lib/ai/flows/group-questions";
import { aiService } from "@/lib/ai/services/ai.service";
import { auth } from "@/shared/lib/api/firebase"; // For current user ID
import {
  type ApiResponse,
  errorResponse,
  successResponse,
} from "@/shared/lib/api/response";
import { Logger } from "@/shared/lib/utils/logger";
import type { AIProblemInput, LeetCodeProblem } from "@/shared/types";

// SENTINEL: Maximum number of problems allowed for AI grouping to prevent DoS/Cost spikes.
const MAX_PROBLEMS_FOR_GROUPING = 50;

/**
 * Performs AI-powered grouping of coding problems into logical categories.
 *
 * This action takes an array of problem details, formats them for the `groupQuestionsFlow`,
 * and invokes the AI to determine thematic groups based on problem characteristics like
 * tags and titles.
 *
 * @param {AIProblemInput[]} problems - An array of problem objects to be grouped.
 * @returns {Promise<ApiResponse<GroupQuestionsOutput>>} A promise that resolves to a
 * standardized API response containing named groups of questions.
 */
export async function performQuestionGrouping(
  problems: AIProblemInput[],
): Promise<ApiResponse<GroupQuestionsOutput>> {
  // SENTINEL: Input validation to prevent excessive token usage
  if (!problems || !Array.isArray(problems)) {
    return errorResponse({
      code: "VALIDATION_ERROR",
      message: "Invalid input: 'problems' must be an array.",
    });
  }
  if (problems.length > MAX_PROBLEMS_FOR_GROUPING) {
    Logger.warn("Security: Question grouping request exceeded limit", { count: problems.length });
    return errorResponse({
      code: "VALIDATION_ERROR",
      message: `Too many problems provided. Please select up to ${MAX_PROBLEMS_FOR_GROUPING} problems.`,
    });
  }
  if (problems.length === 0) {
    return errorResponse({
      code: "VALIDATION_ERROR",
      message: "At least one problem is required for grouping.",
    });
  }

  const start = Date.now();
  Logger.info("AI question grouping started", { problemCount: problems.length });
  try {
    const result = await aiService.groupQuestions(problems);
    const durationMs = Date.now() - start;
    Logger.info("AI question grouping completed", { durationMs, groupCount: result.groups?.length });
    
    if ('error' in result && typeof result.error === 'string') {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: result.error,
      });
    }
    
    return successResponse(result as GroupQuestionsOutput);
  } catch (error) {
    const durationMs = Date.now() - start;
    Logger.error("Error in AI question grouping", error, { durationMs });
    if (error instanceof Error) {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: `Failed to group questions: ${error.message}`,
      });
    }
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Failed to group questions due to an unknown error. Please try again.",
    });
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
 * @returns {Promise<ApiResponse<FindSimilarQuestionsOutput>>} A promise that resolves to a
 * standardized API response containing similar problems.
 */
export async function performSimilarQuestionSearch(
  currentProblemSlug: string,
  currentProblemCompanySlug: string,
): Promise<ApiResponse<FindSimilarQuestionsOutput>> {
  const start = Date.now();
  Logger.info("AI similar question search started", { currentProblemSlug, currentProblemCompanySlug });
  try {
    // aiService handles the lookup of the problem internally now
    const result = await aiService.findSimilarQuestions(currentProblemSlug, currentProblemCompanySlug);
    const durationMs = Date.now() - start;
    Logger.info("AI similar question search completed", { durationMs });
    
    if ('error' in result && typeof result.error === 'string') {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: result.error,
      });
    }
    
    return successResponse(result as FindSimilarQuestionsOutput);
  } catch (error) {
    const durationMs = Date.now() - start;
    Logger.error("Error in AI similar question search", error, { durationMs, currentProblemSlug, currentProblemCompanySlug });
    if (error instanceof Error) {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: `Failed to find similar questions: ${error.message}`,
      });
    }
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Failed to find similar questions due to an unknown error.",
    });
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
 * @returns {Promise<ApiResponse<GenerateFlashcardsOutput>>} A promise that resolves to a
 * standardized API response containing generated flashcards.
 */
export async function generateFlashcardsAction(
  companyId: string,
): Promise<ApiResponse<GenerateFlashcardsOutput>> {
  const start = Date.now();
  Logger.info("AI flashcard generation started", { companyId });
  try {
    const result = await aiService.generateFlashcards(companyId);

    // Revalidation logic moved here from service, or kept here.
    // We need company details for the tag. aiService doesn't return company object if successful, only flashcards.
    const companyResult = await companyService.getCompanyById(companyId);
    if (companyResult.isSuccess) {
       const company = companyResult.value;
       revalidateTag(`company-slug-${company.slug}`, 'max');
       revalidateTag(`company-detail-${company.id}`, 'max');
    }
    const durationMs = Date.now() - start;
    Logger.info("AI flashcard generation completed", { durationMs, companyId, flashcardCount: ('flashcards' in result) ? result.flashcards.length : 0 });

    if ('error' in result && typeof result.error === 'string') {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: result.error,
      });
    }

    return successResponse(result as GenerateFlashcardsOutput);
  } catch (error) {
    const durationMs = Date.now() - start;
    Logger.error("Error in AI flashcard generation", error, { durationMs, companyId });
    if (error instanceof Error) {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: `Failed to generate flashcards: ${error.message}`,
      });
    }
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "An unknown error occurred while generating flashcards.",
    });
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
 * @returns {Promise<ApiResponse<GenerateCompanyStrategyOutput>>} A promise that resolves to a
 * standardized API response containing the strategy output.
 */
export async function generateCompanyStrategyAction(
  companyId: string,
  targetRoleLevel?: TargetRoleLevel,
): Promise<ApiResponse<GenerateCompanyStrategyOutput>> {
  const start = Date.now();
  Logger.info("AI company strategy generation started", { companyId, targetRoleLevel });
  try {
      const firebaseUser = auth.currentUser;
      const result = await aiService.generateCompanyStrategy(companyId, firebaseUser?.uid, targetRoleLevel);

      const companyResult = await companyService.getCompanyById(companyId);
      if (companyResult.isSuccess) {
        const company = companyResult.value;
        revalidateTag(`company-slug-${company.slug}`, 'max');
        revalidateTag(`company-detail-${company.id}`, 'max');
      }
      const durationMs = Date.now() - start;
      Logger.info("AI company strategy generation completed", { durationMs, companyId });
      
      if ('error' in result && typeof result.error === 'string') {
        return errorResponse({
          code: "EXTERNAL_SERVICE_ERROR",
          message: result.error,
        });
      }
      
      return successResponse(result as GenerateCompanyStrategyOutput);
  } catch (error) {
    const durationMs = Date.now() - start;
    Logger.error("Error in AI company strategy generation", error, { durationMs, companyId });
    if (error instanceof Error) {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: `Failed to generate strategy: ${error.message}`,
      });
    }
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "An unknown error occurred while generating the strategy.",
    });
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
 * @returns {Promise<ApiResponse<GenerateProblemInsightsOutput>>} A promise that resolves to a
 * standardized API response containing problem insights.
 */
export async function generateProblemInsightsAction(
  problem: LeetCodeProblem,
): Promise<ApiResponse<GenerateProblemInsightsOutput>> {
  const start = Date.now();
  Logger.info("AI problem insights generation started", { problemSlug: problem.slug, companySlug: problem.companySlug });
  try {
    const result = await aiService.generateProblemInsights(problem);

    revalidateTag(`problem-slug-${problem.slug}`, 'max');
    revalidateTag(`company-slug-${problem.companySlug}`, 'max');
    revalidateTag(`problem-detail-${problem.id}`, 'max');
    revalidateTag(`company-detail-${problem.companyId}`, 'max');

    const durationMs = Date.now() - start;
    Logger.info("AI problem insights generation completed", { durationMs, problemSlug: problem.slug });

    if ('error' in result && typeof result.error === 'string') {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: result.error,
      });
    }

    return successResponse(result as GenerateProblemInsightsOutput);
  } catch (error) {
    const durationMs = Date.now() - start;
    Logger.error("Error in AI problem insights generation", error, { durationMs, problemSlug: problem.slug });
    if (error instanceof Error) {
      return errorResponse({
        code: "EXTERNAL_SERVICE_ERROR",
        message: `Failed to generate insights: ${error.message}`,
      });
    }
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "An unknown error occurred while generating problem insights.",
    });
  }
}






