import { type NextRequest, NextResponse } from "next/server";

import { problemService } from "@/features/problems/services/problem.service";
import { Logger } from "@/lib/utils/logger";

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

    const result = await problemService.getPublicProblems(companyId, {
      pageSize: 200, // MAX_PROBLEMS_FOR_AI_FEATURES
    });

    if (!result.isSuccess) {
      const durationMs = Date.now() - start;
      Logger.error(
        `[API] Failed to fetch problems for AI features`,
        result.error,
        { requestId, companyId, durationMs }
      );
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    const { problems } = result.value;

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
