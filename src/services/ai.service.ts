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
import { companyService } from "@/services/company.service";
import { problemService } from "@/services/problem.service";
import { userService } from "@/services/user.service";

export class AIService {
  async groupQuestions(
    problems: AIProblemInput[]
  ): Promise<GroupQuestionsOutput> {
    const input: GroupQuestionsInput = {
      questions: problems.map((p) => ({
        ...p,
        link: p.link || `https://example.com/problem/${p.slug}`,
      })),
    };
    return await groupQuestionsFlow(input);
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
    return await findSimilarQuestionsFlow(input);
  }

  async generateFlashcards(
    companyId: string
  ): Promise<GenerateFlashcardsOutput | { error: string }> {
    if (!companyId)
      return { error: "Company ID is required to generate flashcards." };

    const company = await companyService.getCompanyById(companyId);
    if (!company) return { error: `Company with ID ${companyId} not found.` };

    const problemsResponse = await problemService.getProblemsByCompany(companyId);

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

    return await generateFlashcardsFlow({
      companyName: company.name,
      problems: problemInputs,
    });
  }

  async generateCompanyStrategy(
    companyId: string,
    userId?: string,
    targetRoleLevel?: TargetRoleLevel
  ): Promise<GenerateCompanyStrategyOutput | { error: string }> {
    if (!companyId)
      return { error: "Company ID is required to generate a strategy." };

    const company = await companyService.getCompanyById(companyId);
    if (!company) return { error: `Company with ID ${companyId} not found.` };

    const problemsResponse = await problemService.getProblemsByCompany(companyId);

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

    return await generateCompanyStrategyFlow({
      companyName: company.name,
      problems: problemInputs,
      targetRoleLevel,
      educationHistory,
      workHistory,
    });
  }

  async generateProblemInsights(
    problem: LeetCodeProblem
  ): Promise<GenerateProblemInsightsOutput | { error: string }> {
    if (!problem || !problem.companySlug || !problem.slug)
      return {
        error:
          "Problem details including company and problem slugs are required.",
      };

    const problemDescriptionForAI = `Problem Title: "${problem.title}" (Difficulty: ${problem.difficulty}). Tags: ${problem.tags.join(", ")}. Link (for context only): ${problem.link}. Analyze this problem to provide key concepts, common data structures, common algorithms, and a high-level hint.`;

    const input: GenerateProblemInsightsInput = {
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags,
      problemDescription: problemDescriptionForAI,
    };
    return await generateProblemInsightsFlow(input);
  }
}

export const aiService = new AIService();
