/**
 * @fileoverview A redesigned client-side component that organizes company details into interactive tabs.
 *
 * This component features a modern, minimalist design with horizontal tabs,
 * and completely restyled content sections for a cohesive user experience.
 */
"use client";

import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain, Target, Users } from "lucide-react";
import ProblemList from "@/components/problem/problem-list";
import type { Company, LeetCodeProblem, ProblemListFilters } from "@/types";
import { getAIProblems } from "@/actions/problem.actions";

const AIGroupingSection = dynamic(
  () => import("@/components/ai/ai-grouping-section"),
  {
    loading: () => (
      <div className="animate-pulse h-48 bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
        Loading AI Grouping...
      </div>
    ),
  },
);

const DynamicFlashcardGenerator = dynamic(
  () => import("@/components/ai/flashcard-generator"),
  {
    loading: () => (
      <div className="animate-pulse h-48 bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
        Loading Flashcards...
      </div>
    ),
  },
);

const CompanyStrategyGenerator = dynamic(
  () => import("@/components/ai/company-strategy-generator"),
  {
    loading: () => (
      <div className="animate-pulse h-48 bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
        Loading Strategy Generator...
      </div>
    ),
  },
);

const CompanyProblemStats = dynamic(
  () => import("@/components/company/company-problem-stats"),
  {
    loading: () => <div className="animate-pulse h-36 bg-muted rounded-lg" />,
  },
);

const MAX_PROBLEMS_FOR_AI_FEATURES = 200;

interface CompanyTabsProps {
  company: Company;
  displayProblemCount: number;
  initialProblems: LeetCodeProblem[];
  initialHasMore: boolean;
  initialNextCursor: string | null | undefined;
  initialFilters: ProblemListFilters;
  itemsPerPage: number;
}

export default function CompanyTabs({
  company,
  displayProblemCount,
  initialProblems,
  initialHasMore,
  initialNextCursor,
  initialFilters,
  itemsPerPage,
}: CompanyTabsProps) {
  const [aiProblems, setAiProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(true);

  useEffect(() => {
    async function fetchAIProblems() {
      if (!company.id) return;

      setIsLoadingAI(true);
      try {
        const problems = await getAIProblems(company.id);
        setAiProblems(problems);
      } catch (error) {
        console.error("Failed to fetch problems for AI features:", error);
      } finally {
        setIsLoadingAI(false);
      }
    }
    fetchAIProblems();
  }, [company.id]);

  return (
    <Tabs defaultValue="problems" orientation="horizontal" className="w-full">
      <div className="w-full overflow-x-auto pb-2">
        <TabsList className="inline-flex w-auto justify-start h-auto p-1 bg-muted/50 rounded-lg">
          <TabsTrigger value="problems" className="px-4 py-2">
            <BookOpen className="h-4 w-4 mr-2" />
            Problems
          </TabsTrigger>
          <TabsTrigger value="stats" className="px-4 py-2">
            <Brain className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="ai-grouping" className="px-4 py-2">
            <Brain className="h-4 w-4 mr-2" />
            AI Groups
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="px-4 py-2">
            <Target className="h-4 w-4 mr-2" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="strategy" className="px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            Strategy
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="mt-6">
        <TabsContent value="problems" className="mt-0">
          <ProblemList
            key={company.id}
            companyId={company.id}
            companySlug={company.slug}
            initialProblems={initialProblems}
            initialHasMore={initialHasMore ?? false}
            initialNextCursor={initialNextCursor ?? undefined}
            itemsPerPage={itemsPerPage}
            initialFilters={initialFilters}
          />
        </TabsContent>
        <TabsContent value="stats" className="mt-0">
          <Suspense
            fallback={<div className="animate-pulse h-36 bg-muted rounded-lg" />}
          >
            <CompanyProblemStats company={company} />
          </Suspense>
        </TabsContent>
        <TabsContent value="ai-grouping" className="mt-0">
          <AIGroupingSection
            problems={aiProblems}
            companyName={company.name}
            companySlug={company.slug}
          />
        </TabsContent>
        <TabsContent value="flashcards" className="mt-0">
          <DynamicFlashcardGenerator
            companyId={company.id}
            companyName={company.name}
            companySlug={company.slug}
          />
        </TabsContent>
        <TabsContent value="strategy" className="mt-0">
          <CompanyStrategyGenerator
            companyId={company.id}
            companyName={company.name}
            companySlug={company.slug}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
