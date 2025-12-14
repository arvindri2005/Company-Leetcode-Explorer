/**
 * @fileoverview API route for fetching a paginated and filtered list of problems for a company.
 *
 * This file defines a Next.js API route that handles POST requests to retrieve
 * coding problems associated with a specific company. It supports cursor-based
 * pagination, various filters (difficulty, recency, status, search term), and
 * sorting. It uses Zod for robust input validation.
 */
import { NextResponse } from "next/server";
import { problemService } from "@/services/problem.service";
import { z } from "zod";
import type {
  DifficultyFilter,
  LastAskedFilter,
  SortKey,
} from "@/types";

/**
 * Zod schema for validating the incoming request body for fetching problems.
 *
 * This schema ensures that the request contains a valid company ID, and that
 * optional parameters like cursor, pageSize, and filters are of the correct type
 * and within acceptable ranges.
 */
const problemRequestSchema = z.object({
  companyId: z.string().optional(),
  cursor: z.string().optional(),
  pageSize: z.number().min(1).max(50).default(15),
  userId: z.string().optional(),
  // Optimization hints
  totalProblemCount: z.number().optional(),
  difficultyCounts: z.object({
    Easy: z.number(),
    Medium: z.number(),
    Hard: z.number(),
  }).optional(),
  companySlug: z.string().optional(),
  filters: z
    .object({
      difficultyFilter: z.array(z.string()).optional(),
      lastAskedFilter: z.array(z.string()).optional(),
      statusFilter: z.array(z.string()).optional(),
      searchTerm: z.string().optional(),
      sortKey: z.string().optional(),
    })
    .optional(),
});

/**
 * Handles POST requests to fetch a list of problems for a specific company.
 *
 * This function validates the request body against the `problemRequestSchema`.
 * If valid, it passes the parameters to the `getProblemsByCompanyFromDb` function
 * to query the database. It returns a paginated list of problems based on the
 * provided cursor, page size, filters, and sorting options.
 *
 * @param {Request} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A response containing a paginated list of problems
 * and a new cursor, or an error response if the request is invalid or an issue occurs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedRequest = problemRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedRequest.error.format(),
        },
        { status: 400 },
      );
    }

    const { 
      companyId, 
      cursor, 
      pageSize, 
      filters, 
      userId,
      totalProblemCount,
      difficultyCounts,
      companySlug
    } = parsedRequest.data;
    console.log("[API] /api/problems called with userId:", userId);

    let result;
    if (companyId) {
      // Optimization: If we have counts and slug from client, we can skip fetching company
      let companySlugToUse = companySlug;
      let totalProblemCountToUse = totalProblemCount;
      let difficultyCountsToUse = difficultyCounts;

      if (!companySlugToUse || totalProblemCountToUse === undefined || !difficultyCountsToUse) {
         // Fetch company to get optimization data (counts, slug)
         // This is cached, so it's cheap compared to getCountFromServer
         const { companyService } = await import("@/services/company.service");
         const company = await companyService.getCompanyById(companyId);
         companySlugToUse = company?.slug;
         totalProblemCountToUse = company?.problemCount;
         difficultyCountsToUse = company?.difficultyCounts;
      }

      result = await problemService.getPublicProblems(companyId, {
        cursor,
        pageSize,
        difficultyFilter: filters?.difficultyFilter as DifficultyFilter[],
        lastAskedFilter: filters?.lastAskedFilter as LastAskedFilter[],
        searchTerm: filters?.searchTerm,
        sortKey: filters?.sortKey as SortKey,
        // userId removed as it is not supported in public/cached flow
        // Optimization params
        companySlug: companySlugToUse,
        totalProblemCount: totalProblemCountToUse,
        difficultyCounts: difficultyCountsToUse,
      });
    } else {
      // Fetch all problems if no companyId is provided
      const { problemService: ps } = await import("@/services/problem.service");
      result = await ps.getAllProblemsPaginated({
        cursor,
        pageSize,
        difficultyFilter: filters?.difficultyFilter as DifficultyFilter[],
        lastAskedFilter: filters?.lastAskedFilter as LastAskedFilter[],
        searchTerm: filters?.searchTerm,
        sortKey: filters?.sortKey as SortKey,
        userId,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/problems:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch problems", details: errorMessage },
      { status: 500 },
    );
  }
}
