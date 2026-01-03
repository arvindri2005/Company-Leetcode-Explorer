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
import { Logger } from "@/lib/logger";
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
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  let companyId: string | undefined;

  try {
    const { searchParams } = new URL(request.url);

    // Parse parameters
    companyId = searchParams.get("companyId") || undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const pageSize = parseInt(searchParams.get("pageSize") || "15");
    // SENTINEL: Prevent IDOR by ignoring client-provided userId in public API.
    // User data should only be fetched via authenticated endpoints or derived from session tokens.
    const userId = undefined; 
    const companySlug = searchParams.get("companySlug") || undefined;
    const totalProblemCount = searchParams.get("totalProblemCount") ? parseInt(searchParams.get("totalProblemCount")!) : undefined;
    
    // Parse difficulty counts if provided as JSON string, otherwise undefined
    let difficultyCounts;
    const difficultyCountsParam = searchParams.get("difficultyCounts");
    if (difficultyCountsParam) {
      try {
        difficultyCounts = JSON.parse(difficultyCountsParam);
      } catch (e) {
        Logger.warn("Invalid difficultyCounts param", { error: e, requestId });
      }
    }

    // Filters
    const searchTerm = searchParams.get("searchTerm") || undefined;
    const sortKey = (searchParams.get("sortKey") as SortKey) || undefined;
    const difficultyFilter = searchParams.getAll("difficulty") as DifficultyFilter[];
    const lastAskedFilter = searchParams.getAll("lastAsked") as LastAskedFilter[];

    Logger.info("[API] /api/problems (GET) started", { 
      requestId, 
      companyId, 
      cursor, 
      pageSize,
      filters: { difficultyFilter, lastAskedFilter, searchTerm, sortKey } 
    });

    let result;
    if (companyId) {
      // Optimization: If we have counts and slug from client, we can skip fetching company
      let companySlugToUse = companySlug;
      let totalProblemCountToUse = totalProblemCount;
      let difficultyCountsToUse = difficultyCounts;

      if (!companySlugToUse || totalProblemCountToUse === undefined || !difficultyCountsToUse) {
         // Fetch company to get optimization data (counts, slug)
         const { companyService } = await import("@/services/company.service");
         const company = await companyService.getCompanyById(companyId);
         companySlugToUse = company?.slug;
         totalProblemCountToUse = company?.problemCount;
         difficultyCountsToUse = company?.difficultyCounts;
      }

      result = await problemService.getPublicProblems(companyId, {
        cursor,
        pageSize,
        difficultyFilter: difficultyFilter.length > 0 ? difficultyFilter : undefined,
        lastAskedFilter: lastAskedFilter.length > 0 ? lastAskedFilter : undefined,
        searchTerm,
        sortKey,
        companySlug: companySlugToUse,
        totalProblemCount: totalProblemCountToUse,
        difficultyCounts: difficultyCountsToUse,
      });
    } else {
      // Fetch all problems if no companyId is provided
      // Use the Bridge service to allow for potential future user-enrichment, even if userId is currently undefined.
      const { userProblemBridgeService } = await import("@/services/user-problem-bridge.service");
      result = await userProblemBridgeService.getAllProblemsPaginatedWithUserStatus({
        cursor,
        pageSize,
        difficultyFilter: difficultyFilter.length > 0 ? difficultyFilter : undefined,
        lastAskedFilter: lastAskedFilter.length > 0 ? lastAskedFilter : undefined,
        searchTerm,
        sortKey,
        userId,
      });
    }

    const durationMs = Date.now() - startTime;
    Logger.info("[API] /api/problems (GET) completed", { 
      requestId, 
      durationMs, 
      resultCount: result.problems?.length,
      hasMore: result.hasMore 
    });

    return NextResponse.json(result);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    Logger.error("Error in /api/problems", error, { requestId, durationMs, companyId });
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch problems", details: errorMessage },
      { status: 500 },
    );
  }
}
