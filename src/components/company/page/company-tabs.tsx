/**
 * @fileoverview A redesigned client-side component that organizes company details into interactive tabs.
 *
 * This component features a modern, minimalist design with vertical tabs,
 * and completely restyled content sections for a cohesive user experience.
 */
"use client";

import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain, Target, Users } from "lucide-react";
import ProblemListV2 from "@/components/problem/problem-list-v2";
import type { Company, LeetCodeProblem, ProblemListFilters } from "@/types";

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

const CompanyProblemStatsV2 = dynamic(
  () => import("@/components/company/company-problem-stats-v2"),
  {
    loading: () => <div className="animate-pulse h-36 bg-muted rounded-lg" />,
  },
);

const MAX_PROBLEMS_FOR_AI_FEATURES = 200;

interface CompanyTabsV3Props {
  company: Company;
  displayProblemCount: number;
  initialProblems: LeetCodeProblem[];
  initialHasMore: boolean;
  initialNextCursor: string | null | undefined;
  initialFilters: ProblemListFilters;
  itemsPerPage: number;
}

export default function CompanyTabsV3({
  company,
  displayProblemCount,
  initialProblems,
  initialHasMore,
  initialNextCursor,
  initialFilters,
  itemsPerPage,
}: CompanyTabsV3Props) {
  const [aiProblems, setAiProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(true);

import { getAIProblems } from "@/actions/problem.actions";

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
    <Tabs defaultValue="problems" orientation="vertical" className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <TabsList className="flex flex-col h-full bg-card border rounded-lg p-2 space-y-2">
            <TabsTrigger value="problems" className="w-full justify-start p-4 text-lg">
              <BookOpen className="h-5 w-5 mr-3" />
              Problems
            </TabsTrigger>
            <TabsTrigger value="stats" className="w-full justify-start p-4 text-lg">
              <Brain className="h-5 w-5 mr-3" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="ai-grouping" className="w-full justify-start p-4 text-lg">
              <Brain className="h-5 w-5 mr-3" />
              AI Groups
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="w-full justify-start p-4 text-lg">
              <Target className="h-5 w-5 mr-3" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="strategy" className="w-full justify-start p-4 text-lg">
              <Users className="h-5 w-5 mr-3" />
              Strategy
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="md:col-span-3">
          <TabsContent value="problems" className="mt-0">
            <ProblemListV2
              key={company.id}
              companyId={company.id}
              companySlug={company.slug}
              initialProblems={initialProblems}
              initialHasMore={initialHasMore ?? false}
              initialNextCursor={initialNextCursor}
              itemsPerPage={itemsPerPage}
              initialFilters={initialFilters}
            />
          </TabsContent>
          <TabsContent value="stats" className="mt-0">
            <Suspense
              fallback={<div className="animate-pulse h-36 bg-muted rounded-lg" />}
            >
              <CompanyProblemStatsV2 company={company} />
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
      </div>
    </Tabs>
  );
}
