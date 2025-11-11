"use server";

import { getProblemsByCompanyFromDb } from "@/lib/data";
import type { LeetCodeProblem } from "@/types";

const MAX_PROBLEMS_FOR_AI_FEATURES = 200;

/**
 * Server action to fetch a list of problems for a company,
 * specifically for use in AI-powered features.
 *
 * @param companyId - The ID of the company.
 * @returns A promise that resolves to the list of problems.
 */
export async function getAIProblems(
  companyId: string,
): Promise<LeetCodeProblem[]> {
  try {
    const { problems } = await getProblemsByCompanyFromDb(companyId, {
      pageSize: MAX_PROBLEMS_FOR_AI_FEATURES,
    });
    return problems;
  } catch (error) {
    console.error(
      `[Server Action] Failed to fetch problems for AI features for company ${companyId}:`,
      error,
    );
    // In a real-world app, you might want to return a more structured error response
    return [];
  }
}
