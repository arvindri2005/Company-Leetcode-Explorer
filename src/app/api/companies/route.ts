/**
 * @fileoverview API route for paginating through a list of companies.
 *
 * This file defines a Next.js API route that supports both POST and GET requests
 * for fetching subsequent pages of company data. It uses a cursor-based pagination
 * strategy, which is efficient for large datasets. The route handles input
 * validation and calls a data-layer function to retrieve the companies.
 */
import { NextRequest, NextResponse } from "next/server";
import { companyService } from "@/features/companies/services/company.service";
import { Logger } from "@/lib/utils/logger";
import { randomUUID } from "crypto";

/**
 * Handles POST requests to fetch the next page of companies.
 *
 * This function implements cursor-based pagination. It expects a JSON body
 * containing a `cursor` (the ID of the last item from the previous page), an
 * optional `pageSize`, and an optional `searchTerm`. It validates these inputs
 * and then fetches the next set of companies.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A response containing the next page of companies,
 * a `hasMore` flag, and the new cursor, or an error response.
 */
export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const startTime = Date.now();
  let context: Record<string, any> = { requestId };

  try {
    const { cursor, pageSize = 9, searchTerm } = await request.json();
    context = { ...context, cursor, pageSize, searchTerm };

    Logger.info("[API] /api/companies (POST) started", context);

    if (cursor && typeof cursor !== "string") {
      Logger.warn("[API] Invalid cursor format", context);
      return NextResponse.json(
        { error: "Invalid cursor format" },
        { status: 400 },
      );
    }
    if (
      pageSize &&
      (typeof pageSize !== "number" || pageSize < 1 || pageSize > 50)
    ) {
      Logger.warn("[API] Invalid pageSize", context);
      return NextResponse.json(
        { error: "Invalid pageSize. Must be between 1 and 50" },
        { status: 400 },
      );
    }
    if (searchTerm && typeof searchTerm !== "string") {
      Logger.warn("[API] Invalid searchTerm format", context);
      return NextResponse.json(
        { error: "Invalid searchTerm format" },
        { status: 400 },
      );
    }
    if (!cursor) {
      Logger.warn("[API] Missing cursor", context);
      return NextResponse.json(
        { error: "Cursor is required for pagination" },
        { status: 400 },
      );
    }

    const result = await companyService.getCompanies({
      cursor,
      pageSize,
      searchTerm: searchTerm?.trim(),
    });

    const durationMs = Date.now() - startTime;
    Logger.info("[API] /api/companies (POST) completed", {
      ...context,
      durationMs,
      resultCount: result.companies.length,
      hasMore: result.hasMore,
    });

    return NextResponse.json(result);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    Logger.error("Error in /api/companies (POST)", error, {
      ...context,
      durationMs,
    });
    return NextResponse.json(
      { error: "Internal server error", companies: [], hasMore: false },
      { status: 500 },
    );
  }
}

/**
 * Handles GET requests to fetch the next page of companies.
 *
 * This function provides an alternative way to use the pagination endpoint, accepting
 * the `cursor`, `pageSize`, and `searchTerm` as URL query parameters. It serves
 * the same purpose as the POST handler but may be easier to use in certain contexts (e.g., direct linking).
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} A response containing the next page of companies,
 * a `hasMore` flag, and the new cursor, or an error response.
 */
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const startTime = Date.now();

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const pageSize = parseInt(searchParams.get("pageSize") || "9");
  const searchTerm = searchParams.get("searchTerm") || undefined;

  const context: Record<string, any> = {
    requestId,
    cursor,
    pageSize,
    searchTerm,
  };

  Logger.info("[API] /api/companies (GET) started", context);

  if (!cursor) {
    Logger.warn("[API] Missing cursor parameter", context);
    return NextResponse.json(
      { error: "Cursor parameter is required" },
      { status: 400 },
    );
  }

  try {
    const result = await companyService.getCompanies({
      cursor,
      pageSize,
      searchTerm: searchTerm?.trim(),
    });

    const durationMs = Date.now() - startTime;
    Logger.info("[API] /api/companies (GET) completed", {
      ...context,
      durationMs,
      resultCount: result.companies.length,
      hasMore: result.hasMore,
    });

    return NextResponse.json(result);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    Logger.error("Error in /api/companies (GET)", error, {
      ...context,
      durationMs,
    });
    return NextResponse.json(
      { error: "Internal server error", companies: [], hasMore: false },
      { status: 500 },
    );
  }
}






