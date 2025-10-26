/**
 * @fileoverview API route for paginating through a list of companies.
 *
 * This file defines a Next.js API route that supports both POST and GET requests
 * for fetching subsequent pages of company data. It uses a cursor-based pagination
 * strategy, which is efficient for large datasets. The route handles input
 * validation and calls a data-layer function to retrieve the companies.
 */
import { NextRequest, NextResponse } from "next/server";
import { loadMoreCompanies } from "@/lib/data";

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
  try {
    const { cursor, pageSize = 9, searchTerm } = await request.json();

    if (cursor && typeof cursor !== "string") {
      return NextResponse.json(
        { error: "Invalid cursor format" },
        { status: 400 },
      );
    }
    if (
      pageSize &&
      (typeof pageSize !== "number" || pageSize < 1 || pageSize > 50)
    ) {
      return NextResponse.json(
        { error: "Invalid pageSize. Must be between 1 and 50" },
        { status: 400 },
      );
    }
    if (searchTerm && typeof searchTerm !== "string") {
      return NextResponse.json(
        { error: "Invalid searchTerm format" },
        { status: 400 },
      );
    }
    if (!cursor) {
      return NextResponse.json(
        { error: "Cursor is required for pagination" },
        { status: 400 },
      );
    }

    const result = await loadMoreCompanies(
      cursor,
      pageSize,
      searchTerm?.trim(),
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in companies API route:", error);
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
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const pageSize = parseInt(searchParams.get("pageSize") || "9");
  const searchTerm = searchParams.get("searchTerm") || undefined;

  if (!cursor) {
    return NextResponse.json(
      { error: "Cursor parameter is required" },
      { status: 400 },
    );
  }

  try {
    const result = await loadMoreCompanies(cursor, pageSize, searchTerm);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in companies GET API route:", error);
    return NextResponse.json(
      { error: "Internal server error", companies: [], hasMore: false },
      { status: 500 },
    );
  }
}
