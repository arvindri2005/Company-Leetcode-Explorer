import { NextRequest, NextResponse } from "next/server";
import { problemService } from "@/services/problem.service";
import { Logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  let companyId: string | undefined;

  try {
    const resolvedParams = await params;
    companyId = resolvedParams.companyId;

    Logger.info(`[API] Fetching AI problems started`, {
      requestId,
      companyId,
      path: request.nextUrl.pathname
    });
    
    if (!companyId) {
      Logger.warn(`[API] Missing companyId`, { requestId });
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const { problems } = await problemService.getPublicProblems(companyId, {
      pageSize: 200, // MAX_PROBLEMS_FOR_AI_FEATURES
    });

    const durationMs = Date.now() - start;
    Logger.info(`[API] Fetching AI problems completed`, {
      requestId,
      companyId,
      count: problems.length,
      durationMs
    });

    return NextResponse.json(problems);
  } catch (error) {
    const durationMs = Date.now() - start;
    Logger.error(
      `[API] Failed to fetch problems for AI features`,
      error,
      { requestId, companyId, durationMs }
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
