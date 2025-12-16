import { NextRequest, NextResponse } from "next/server";
import { problemService } from "@/services/problem.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const { problems } = await problemService.getPublicProblems(companyId, {
      pageSize: 200, // MAX_PROBLEMS_FOR_AI_FEATURES
    });

    return NextResponse.json(problems);
  } catch (error) {
    console.error(
      `[API] Failed to fetch problems for AI features for company:`,
      error
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
