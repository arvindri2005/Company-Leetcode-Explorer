/**
 * @fileoverview Server-side actions for managing coding problem data.
 *
 * This module provides Next.js server actions for creating and retrieving
 * coding problems from the Firestore database. It includes functions for adding
 * a single problem and fetching details for a batch of problems.
 * These actions also handle data validation and cache revalidation.
 */
"use server";

import type {
  LeetCodeProblem,
} from "@/types";
import { problemService } from "@/services/problem.service";
import { companyService } from "@/services/company.service";
import { revalidateTag, revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";

/**
 * Adds a new coding problem to the database or updates an existing one.
 *
 * This action validates the input data, ensuring required fields are present and
 * the problem link is valid. It checks if a problem with the same title already exists
 * for the given company. If so, it updates the `lastAskedPeriod`; otherwise, it creates
 * a new problem document. It then triggers cache revalidation for all relevant
 * company and problem pages.
 *
 * @param {Omit<LeetCodeProblem, 'id' | 'normalizedTitle' | 'companySlug' | 'slug'>} problemDataInput - The data for the problem to add, excluding auto-generated fields.
 * @returns {Promise<{ success: boolean; data?: LeetCodeProblem; updated?: boolean; error?: string }>}
 * A promise that resolves to an object indicating the outcome. On success, `data` contains
 * the added/updated problem. The `updated` flag is true if an existing record was modified.
 * On failure, `error` contains a descriptive message.
 */
export async function addProblem(
  problemDataInput: Omit<
    LeetCodeProblem,
    "id" | "normalizedTitle" | "companySlug" | "slug"
  >,
): Promise<{
  success: boolean;
  data?: LeetCodeProblem;
  updated?: boolean;
  error?: string;
}> {
  try {
    const problemData = {
      ...problemDataInput,
      normalizedTitle: problemDataInput.title.toLowerCase(),
    };

    if (
      !problemData.title ||
      !problemData.difficulty ||
      !problemData.link ||
      !problemData.companyId ||
      !problemData.lastAskedPeriod
    ) {
      return {
        success: false,
        error:
          "Missing required fields for problem submission (Title, Difficulty, Link, Company, Last Asked Period).",
      };
    }
    if (
      !problemData.link.startsWith("http://") &&
      !problemData.link.startsWith("https://")
    ) {
      return {
        success: false,
        error:
          "Invalid problem link format. Must start with http:// or https://.",
      };
    }

    const company = await companyService.getCompanyById(problemData.companyId);
    if (!company) {
      return {
        success: false,
        error: `Company with ID ${problemData.companyId} not found.`,
      };
    }

    // Tags are now optional, so `problemData.tags.length === 0` is a valid state
    // and not considered a missing required field. The problemData.tags will be an empty array if no tags were provided.

    const {
      id: problemId,
      updated,
      error: dbError,
    } = await problemService.addProblem(problemData.companyId, problemData);

    if (dbError || !problemId) {
      return {
        success: false,
        error: dbError || "Failed to save problem to the database.",
      };
    }


    revalidateTag("all-problems", "max");
    revalidateTag(`problems-company-${problemData.companyId}`, "max");
    revalidateTag(`company-${problemData.companyId}-v2`, "max");
    revalidateTag(`company-slug-${company.slug}-v2`, "max");
    revalidatePath(`/company/${company.slug}`);
    ["/", "/submit-problem"].forEach((p) => revalidatePath(p));

    return {
      success: true,
      data: {
        ...problemData,
        id: problemId,
        slug: slugify(problemData.title),
        companySlug: company.slug,
      },
      updated,
    };
  } catch (error) {
    console.error("Error adding problem (action level):", error);
    if (error instanceof Error) return { success: false, error: error.message };
    return {
      success: false,
      error: "An unknown error occurred while adding the problem.",
    };
  }
}

/**
 * Fetches the full details for a batch of specified problems.
 *
 * This action is designed for efficiently retrieving multiple problem documents when their
 * IDs and parent company IDs are known. It's useful for scenarios like displaying a
 * list of bookmarked problems where the full problem objects are needed.
 *
 * @param {Array<{problemId: string, companyId: string}>} problemRefs - An array of objects,
 * where each object contains a `problemId` and its corresponding `companyId`.
 * @returns {Promise<LeetCodeProblem[]>} A promise that resolves to an array of the requested
 * `LeetCodeProblem` objects. It filters out any problems that could not be found and
 * returns an empty array if the input is empty or an error occurs.
 */
export async function getProblemDetailsBatchAction(
  problemRefs: Array<{ problemId: string; companyId: string }>,
): Promise<LeetCodeProblem[]> {
  if (!problemRefs || problemRefs.length === 0) return [];
  try {
    const problems = await Promise.all(
      problemRefs.map((ref) =>
        problemService.getProblemDetails(ref.companyId, ref.problemId),
      ),
    );
    return problems.filter(Boolean) as LeetCodeProblem[];
  } catch (error) {
    console.error("Error in getProblemDetailsBatchAction:", error);
    return [];
  }
}

/**
 * Fetches a problem and its associated company data using their respective slugs.
 *
 * @param {string} companySlug - The slug of the company.
 * @param {string} problemSlug - The slug of the problem.
 * @returns {Promise<{ company: Company | undefined; problem: LeetCodeProblem | undefined }>}
 */
export async function getProblemByCompanySlugAndProblemSlugAction(
  companySlug: string,
  problemSlug: string,
) {
  try {
    return await problemService.getProblemByCompanySlugAndProblemSlug(companySlug, problemSlug);
  } catch (error) {
    console.error(
      `Error fetching problem by company slug ${companySlug} and problem slug ${problemSlug}:`,
      error,
    );
    return { company: undefined, problem: undefined };
  }
}

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
    const { problems } = await problemService.getProblemsByCompany(companyId, {
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
