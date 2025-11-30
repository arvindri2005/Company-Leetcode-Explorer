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
import {
  addProblemToDb,
  getProblemDetailsFromDb,
  getCompanyById,
} from "@/lib/data";
import { revalidatePath, revalidateTag } from "next/cache";
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

    const company = await getCompanyById(problemData.companyId);
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
    } = await addProblemToDb(problemData.companyId, problemData);

    if (dbError || !problemId) {
      return {
        success: false,
        error: dbError || "Failed to save problem to the database.",
      };
    }

    revalidateTag("problems-collection-broad", 'max');
    revalidateTag(`problems-for-company-${problemData.companyId}`, 'max');
    revalidateTag(`company-detail-${problemData.companyId}`, 'max');
    revalidateTag(`company-slug-${company.slug}`, 'max');
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
        getProblemDetailsFromDb(ref.companyId, ref.problemId),
      ),
    );
    return problems.filter(Boolean) as LeetCodeProblem[];
  } catch (error) {
    console.error("Error in getProblemDetailsBatchAction:", error);
    return [];
  }
}
