import {
  GroupQuestionsInput,
  GroupQuestionsOutput,
  groupQuestions as groupQuestionsFlow,
} from "@/ai/flows/group-questions";
import {
  FindSimilarQuestionsInput,
  FindSimilarQuestionsOutput,
  findSimilarQuestions as findSimilarQuestionsFlow,
} from "@/ai/flows/find-similar-questions-flow";
import {
  GenerateFlashcardsOutput,
  FlashcardProblemInput,
  generateFlashcardsForCompany as generateFlashcardsFlow,
} from "@/ai/flows/generate-flashcards-flow";
import {
  GenerateCompanyStrategyOutput,
  CompanyStrategyProblemInput,
  TargetRoleLevel,
  EducationExperience,
  WorkExperience,
  generateCompanyStrategy as generateCompanyStrategyFlow,
} from "@/ai/flows/generate-company-strategy-flow";
import {
  GenerateProblemInsightsInput,
  GenerateProblemInsightsOutput,
  generateProblemInsights as generateProblemInsightsFlow,
} from "@/ai/flows/generate-problem-insights-flow";
import { AIProblemInput, LeetCodeProblem } from "@/types";
import { companyService } from "@/features/companies/services/company.service";
import { problemService } from "@/features/problems/services/problem.service";
import { userService } from "@/features/profile/services/user.service";
import { Logger } from "@/lib/utils/logger";
import { cacheManager, CacheTTL } from "@/lib/utils/cache";
import { unstable_cache } from "next/cache";
import { aiFlowRegistry } from "@/ai/flow-registry";

// Register default flows
aiFlowRegistry.register("groupQuestions", groupQuestionsFlow);
aiFlowRegistry.register("findSimilarQuestions", findSimilarQuestionsFlow);
aiFlowRegistry.register("generateFlashcards", generateFlashcardsFlow);
aiFlowRegistry.register("generateCompanyStrategy", generateCompanyStrategyFlow);
aiFlowRegistry.register("generateProblemInsights", generateProblemInsightsFlow);

export class AIService {
  private async withObservability<T>(
    flowName: string,
    operation: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    Logger.info(`[AI] Starting ${flowName}`, {
      requestId,
      flowName,
      ...metadata,
    });

    try {
      const result = await operation();
      const durationMs = Date.now() - startTime;

      Logger.info(`[AI] Completed ${flowName}`, {
        requestId,
        flowName,
        durationMs,
        success: true,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      Logger.error(`[AI] Failed ${flowName}`, error, {
        requestId,
        flowName,
        durationMs,
        success: false,
        ...metadata,
      });
      throw error;
    }
  }

  async groupQuestions(
    problems: AIProblemInput[]
  ): Promise<GroupQuestionsOutput> {
    const input: GroupQuestionsInput = {
      questions: problems.map((p) => ({
        ...p,
        link: p.link || `https://example.com/problem/${p.slug}`,
      })),
    };
    
    const flow = aiFlowRegistry.get<GroupQuestionsInput, GroupQuestionsOutput>("groupQuestions");

    return await this.withObservability(
      "groupQuestions",
      () => flow(input),
      { problemCount: problems.length }
    );
  }

  async findSimilarQuestions(
    currentProblemSlug: string,
    currentProblemCompanySlug: string
  ): Promise<FindSimilarQuestionsOutput | { error: string }> {
    const { company, problem: currentProblem } =
      await problemService.getProblemByCompanySlugAndProblemSlug(
        currentProblemCompanySlug,
        currentProblemSlug
      );

    if (!currentProblem) {
      return {
        error: `Problem with slug ${currentProblemSlug} not found for company ${currentProblemCompanySlug}.`,
      };
    }

    const input: FindSimilarQuestionsInput = {
      currentProblem: {
        title: currentProblem.title,
        difficulty: currentProblem.difficulty,
        tags: currentProblem.tags,
        slug: currentProblem.slug,
      },
    };

    const flow = aiFlowRegistry.get<FindSimilarQuestionsInput, FindSimilarQuestionsOutput>("findSimilarQuestions");

    return await this.withObservability(
      "findSimilarQuestions",
      () => flow(input),
      { currentProblemSlug, currentProblemCompanySlug }
    );
  }

  async generateFlashcards(
    companyId: string
  ): Promise<GenerateFlashcardsOutput | { error: string }> {
    if (!companyId)
      return { error: "Company ID is required to generate flashcards." };

    const cacheKey = `company-flashcards-${companyId}`;
    const generate = unstable_cache(
      async () => {
        const company = await companyService.getCompanyById(companyId);
        if (!company) return { error: `Company with ID ${companyId} not found.` };

        const problemsResponse = await problemService.getPublicProblems(companyId);

        if (
          !problemsResponse.problems ||
          problemsResponse.problems.length === 0
        ) {
          return { flashcards: [] };
        }

        const problemInputs: FlashcardProblemInput[] =
          problemsResponse.problems.map((p) => ({
            title: p.title,
            difficulty: p.difficulty,
            tags: p.tags,
            lastAskedPeriod: p.lastAskedPeriod as any,
          }));

        const flow = aiFlowRegistry.get<any, GenerateFlashcardsOutput>("generateFlashcards");

        return await this.withObservability(
          "generateFlashcards",
          () => flow({
            companyName: company.name,
            problems: problemInputs,
          }),
          { companyId, companyName: company.name, problemCount: problemInputs.length }
        );
      },
      [cacheKey],
      {
        revalidate: 60 * 60 * 24 * 7, // 7 days
        tags: [`company-flashcards-${companyId}`],
      }
    );

    return await generate();
  }

  async generateCompanyStrategy(
    companyId: string,
    userId?: string,
    targetRoleLevel?: TargetRoleLevel
  ): Promise<GenerateCompanyStrategyOutput | { error: string }> {
    if (!companyId)
      return { error: "Company ID is required to generate a strategy." };

    // If userId is present, we need to fetch user data and personalize the strategy.
    // We do NOT cache personalized strategies to ensure privacy and freshness,
    // unless we implement a complex key strategy. For Nova's scope, we skip caching for personalized.
    if (userId) {
      return await this.generateCompanyStrategyCore(companyId, userId, targetRoleLevel);
    }

    // If no userId, this is a generic strategy request. We can cache this safely.
    const cacheKey = `company-strategy-${companyId}-${targetRoleLevel || 'general'}`;
    const generate = unstable_cache(
      async () => {
        return await this.generateCompanyStrategyCore(companyId, undefined, targetRoleLevel);
      },
      [cacheKey],
      {
        revalidate: 60 * 60 * 24 * 7, // 7 days
        tags: [`company-strategy-${companyId}`],
      }
    );

    return await generate();
  }

  // Refactored core logic to support both cached and uncached paths
  private async generateCompanyStrategyCore(
    companyId: string,
    userId?: string,
    targetRoleLevel?: TargetRoleLevel
  ): Promise<GenerateCompanyStrategyOutput | { error: string }> {
    const company = await companyService.getCompanyById(companyId);
    if (!company) return { error: `Company with ID ${companyId} not found.` };

    const problemsResponse = await problemService.getPublicProblems(companyId);

    if (
      !problemsResponse.problems ||
      problemsResponse.problems.length === 0
    ) {
      const reason =
        targetRoleLevel && targetRoleLevel !== "general"
          ? `No problem data available for ${company.name} to tailor a strategy for the ${targetRoleLevel} role.`
          : `No problem data available for ${company.name} to generate a strategy.`;
      return {
        preparationStrategy: `Cannot generate a detailed strategy for ${company.name} due to lack of problem data. Please add some problems associated with this company first. General advice: Focus on common data structures, algorithms, and practice problem-solving.`,
        focusTopics: [{ topic: "General Problem Solving", reason }],
        todoItems: [
          {
            text: "Add problems for this company to enable strategy generation.",
            isCompleted: false,
          },
        ],
      };
    }

    const problemInputs: CompanyStrategyProblemInput[] =
      problemsResponse.problems.map((p) => ({
        title: p.title,
        difficulty: p.difficulty,
        tags: p.tags,
        lastAskedPeriod: p.lastAskedPeriod as any,
      }));

    let educationHistory: EducationExperience[] | undefined = undefined;
    let workHistory: WorkExperience[] | undefined = undefined;

    if (userId) {
      // Use userService directly instead of calling actions
      const eduResult = await userService.getUserEducation(userId);
       if (Array.isArray(eduResult)) educationHistory = eduResult;

      const workResult = await userService.getUserWorkExperience(userId);
       if (Array.isArray(workResult)) workHistory = workResult;
    }

    const flow = aiFlowRegistry.get<any, GenerateCompanyStrategyOutput>("generateCompanyStrategy");

    return await this.withObservability(
      "generateCompanyStrategy",
      () => flow({
        companyName: company.name,
        problems: problemInputs,
        targetRoleLevel,
        educationHistory,
        workHistory,
      }),
      { companyId, companyName: company.name, problemCount: problemInputs.length, userId, targetRoleLevel }
    );
  }

  async generateProblemInsights(
    problem: LeetCodeProblem
  ): Promise<GenerateProblemInsightsOutput | { error: string }> {
    if (!problem || !problem.companySlug || !problem.slug)
      return {
        error:
          "Problem details including company and problem slugs are required.",
      };

    const cacheKey = `problem-insights-${problem.companySlug}-${problem.slug}`;

    return await cacheManager.wrap(
      cacheKey,
      async () => {
        const problemDescriptionForAI = `Problem Title: "${problem.title}" (Difficulty: ${problem.difficulty}). Tags: ${problem.tags.join(", ")}. Link (for context only): ${problem.link}. Analyze this problem to provide key concepts, common data structures, common algorithms, and a high-level hint.`;

        const input: GenerateProblemInsightsInput = {
          title: problem.title,
          difficulty: problem.difficulty,
          tags: problem.tags,
          problemDescription: problemDescriptionForAI,
        };
        
        const flow = aiFlowRegistry.get<GenerateProblemInsightsInput, GenerateProblemInsightsOutput>("generateProblemInsights");

        return await this.withObservability(
          "generateProblemInsights",
          () => flow(input),
          { problemSlug: problem.slug, companySlug: problem.companySlug }
        );
      },
      {
        revalidate: CacheTTL.STATIC, // 30 days
        tags: [`problem-insights-${problem.slug}`],
      }
    );
  }
}

export const aiService = new AIService();






