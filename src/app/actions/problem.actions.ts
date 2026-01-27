"use server";

/**
 * @fileoverview Server-side actions for managing coding problem data.
 *
 * This module provides Next.js server actions for creating and retrieving
 * coding problems from the Firestore database. It includes functions for adding
 * a single problem and fetching details for a batch of problems.
 * These actions also handle data validation and cache revalidation.
 */

import { revalidatePath,revalidateTag } from "next/cache";

import { companyService } from "@/features/companies/services/company.service";
import { problemService } from "@/features/problems/services/problem.service";
import {
  type ApiResponse,
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import { slugify } from "@/lib/utils";
import { handleServerActionError } from "@/lib/utils/error-handler";
import type {
  LeetCodeProblem,
} from "@/types";
import type { ProblemListFilters } from "@/types";
import type { PaginatedProblemsResponse } from "@/types";

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
 * @returns {Promise<ApiResponse<{ problem: LeetCodeProblem; updated: boolean }>>}
 * A promise that resolves to a standardized API response.
 */
export async function addProblem(
  problemDataInput: Omit<
    LeetCodeProblem,
    "id" | "normalizedTitle" | "companySlug" | "slug"
  >,
): Promise<ApiResponse<{ problem: LeetCodeProblem; updated: boolean }>> {
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
      return errorResponse({
        code: "VALIDATION_ERROR",
        message:
          "Missing required fields for problem submission (Title, Difficulty, Link, Company, LastAskedPeriod).",
      });
    }
    if (
      !problemData.link.startsWith("http://") &&
      !problemData.link.startsWith("https://")
    ) {
      return errorResponse({
        code: "VALIDATION_ERROR",
        message:
          "Invalid problem link format. Must start with http:// or https://.",
      });
    }

    const companyResult = await companyService.getCompanyById(problemData.companyId);
    if (companyResult.isFailure) {
      return errorResponse({
        code: "NOT_FOUND",
        message: `Company with ID ${problemData.companyId} not found.`,
      });
    }
    const company = companyResult.value;

    const result = await problemService.addProblem(problemData.companyId, problemData);

    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { id: problemId, updated } = result.value;

    revalidateTag("all-problems", "max");
    revalidateTag(`problems-company-${problemData.companyId}`, "max");
    revalidateTag(`company-${problemData.companyId}-v2`, "max");
    revalidateTag(`company-slug-${company.slug}-v2`, "max");
    revalidatePath(`/company/${company.slug}`);
    ["/", "/submit-problem"].forEach((p) => revalidatePath(p));

    return successResponse({
      problem: {
        ...problemData,
        id: problemId,
        slug: slugify(problemData.title),
        companySlug: company.slug,
      },
      updated,
    });
  } catch (error) {
    const errorMessage = handleServerActionError(error, "addProblem", {
      companyId: problemDataInput.companyId,
      problemTitle: problemDataInput.title,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: errorMessage,
    });
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
 * @returns {Promise<ApiResponse<LeetCodeProblem[]>>} A promise that resolves to a standardized
 * API response containing the requested problems.
 */
export async function getProblemDetailsBatchAction(
  problemRefs: Array<{ problemId: string; companyId: string }>,
): Promise<ApiResponse<LeetCodeProblem[]>> {
  if (!problemRefs || problemRefs.length === 0) {
    return successResponse([]);
  }
  try {
    const results = await Promise.all(
      problemRefs.map((ref) =>
        problemService.getProblemDetails(ref.companyId, ref.problemId),
      ),
    );
    
    const problems = results
      .filter((result) => result.isSuccess)
      .map((result) => result.value as LeetCodeProblem);
    
    return successResponse(problems);
  } catch (error) {
    const errorMessage = handleServerActionError(error, "getProblemDetailsBatchAction", {
      count: problemRefs.length,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: errorMessage,
    });
  }
}

/**
 * Fetches a problem and its associated company data using their respective slugs.
 *
 * @param {string} companySlug - The slug of the company.
 * @param {string} problemSlug - The slug of the problem.
 * @returns {Promise<ApiResponse<{ company: Company; problem: LeetCodeProblem }>>}
 */
export async function getProblemByCompanySlugAndProblemSlugAction(
  companySlug: string,
  problemSlug: string,
): Promise<ApiResponse<{ company: unknown; problem: LeetCodeProblem }>> {
  try {
    const result = await problemService.getProblemByCompanySlugAndProblemSlug(companySlug, problemSlug);
    
    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }
    
    return successResponse(result.value);
  } catch (error) {
    const errorMessage = handleServerActionError(
      error,
      "getProblemByCompanySlugAndProblemSlugAction",
      { companySlug, problemSlug },
    );
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: errorMessage,
    });
  }
}

/**
 * Fetches multiple problems by their IDs (slugs).
 *
 * @param {string[]} problemIds - The IDs (slugs) of the problems to fetch.
 * @returns {Promise<ApiResponse<LeetCodeProblem[]>>}
 */
export async function getProblemsByIdsBatchAction(
  problemIds: string[],
): Promise<ApiResponse<LeetCodeProblem[]>> {
  try {
    const result = await problemService.getProblemsByIds(problemIds);

    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }

    return successResponse(result.value);
  } catch (error) {
    const errorMessage = handleServerActionError(
      error,
      "getProblemsByIdsBatchAction",
      { count: problemIds.length },
    );
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: errorMessage,
    });
  }
}

/**
 * Server action to load more problems for infinite scrolling.
 *
 * @param {string} companyId - The ID of the company.
 * @param {string} cursor - The cursor to start fetching from.
 * @param {ProblemListFilters} filters - The current filters to apply.
 * @param {number} pageSize - The number of items to fetch.
 * @returns {Promise<ApiResponse<PaginatedProblemsResponse>>}
 */
export async function loadMoreProblemsAction(
  companyId: string,
  cursor: string | undefined | null,
  filters: ProblemListFilters,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedProblemsResponse>> {
  try {
    const result = await problemService.getPublicProblems(companyId, {
      cursor: cursor ?? undefined,
      pageSize,
      difficultyFilter: filters.difficultyFilter,
      lastAskedFilter: filters.lastAskedFilter,
      searchTerm: filters.searchTerm,
      sortKey: filters.sortKey,
    });
    
    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }
    
    return successResponse(result.value);
  } catch (error) {
    const message = handleServerActionError(error, "loadMoreProblemsAction", {
      companyId,
      filters,
      cursor,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message,
    });
  }
}

/**
 * Server action to load more problems for infinite scrolling on the all problems page.
 *
 * @param {string} cursor - The cursor to start fetching from.
 * @param {ProblemListFilters} filters - The current filters to apply.
 * @param {number} pageSize - The number of items to fetch.
 * @returns {Promise<ApiResponse<PaginatedProblemsResponse>>}
 */
export async function loadMoreAllProblemsAction(
  cursor: string,
  filters: ProblemListFilters,
  pageSize: number = 50
): Promise<ApiResponse<PaginatedProblemsResponse>> {
  try {
    const result = await problemService.getAllProblemsPaginated({
      cursor,
      pageSize,
      difficultyFilter: filters.difficultyFilter,
      lastAskedFilter: filters.lastAskedFilter,
      searchTerm: filters.searchTerm,
      sortKey: filters.sortKey,
    });
    
    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }
    
    return successResponse(result.value);
  } catch (error) {
    handleServerActionError(error, "loadMoreAllProblemsAction", {
      filters,
      cursor,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Failed to load more all problems",
    });
  }
}

/**
 * Server action to fetch problems with filters (for client-side filtering).
 * Can be used for initial fetch or loading more.
 */
export async function fetchProblemsAction(
  filters: ProblemListFilters,
  pageSize: number = 50,
  cursor?: string
): Promise<ApiResponse<PaginatedProblemsResponse>> {
  try {
    const result = await problemService.getAllProblemsPaginated({
      cursor,
      pageSize,
      difficultyFilter: filters.difficultyFilter,
      lastAskedFilter: filters.lastAskedFilter,
      searchTerm: filters.searchTerm,
      sortKey: filters.sortKey,
    });
    
    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }
    
    return successResponse(result.value);
  } catch (error) {
    handleServerActionError(error, "fetchProblemsAction", { filters, cursor });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Failed to fetch problems",
    });
  }
}






