import { NextRequest, NextResponse } from "next/server";
import { loadMoreCompanies } from "@/lib/data";

export async function POST(request: NextRequest) {
    try {
        const { cursor, pageSize = 9, searchTerm } = await request.json();

        // Validate inputs
        if (cursor && typeof cursor !== "string") {
            return NextResponse.json(
                { error: "Invalid cursor format" },
                { status: 400 }
            );
        }

        if (
            pageSize &&
            (typeof pageSize !== "number" || pageSize < 1 || pageSize > 50)
        ) {
            return NextResponse.json(
                { error: "Invalid pageSize. Must be between 1 and 50" },
                { status: 400 }
            );
        }

        if (searchTerm && typeof searchTerm !== "string") {
            return NextResponse.json(
                { error: "Invalid searchTerm format" },
                { status: 400 }
            );
        }

        // If no cursor is provided, this is essentially a first page request
        if (!cursor) {
            return NextResponse.json(
                { error: "Cursor is required for pagination" },
                { status: 400 }
            );
        }

        const result = await loadMoreCompanies(
            cursor,
            pageSize,
            searchTerm?.trim()
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in companies API route:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                companies: [],
                hasMore: false,
            },
            { status: 500 }
        );
    }
}

// Optionally support GET requests for simpler usage
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const pageSize = parseInt(searchParams.get("pageSize") || "9");
    const searchTerm = searchParams.get("searchTerm") || undefined;

    if (!cursor) {
        return NextResponse.json(
            { error: "Cursor parameter is required" },
            { status: 400 }
        );
    }

    try {
        const result = await loadMoreCompanies(cursor, pageSize, searchTerm);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in companies GET API route:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                companies: [],
                hasMore: false,
            },
            { status: 500 }
        );
    }
}
