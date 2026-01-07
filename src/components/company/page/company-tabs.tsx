/**
 * @fileoverview A redesigned client-side component that organizes company details into interactive tabs.
 *
 * This component features a modern, minimalist design with horizontal tabs,
 * and completely restyled content sections for a cohesive user experience.
 */
"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain, Target, Users } from "lucide-react";
import { ProblemList } from "@/features/problems";
import type { Company, LeetCodeProblem, ProblemListFilters } from "@/types";
import {
  CompanyAIFeatureSkeleton,
  CompanyStrategySkeleton,
  CompanyStatsSkeleton,
} from "@/components/skeletons/company-ai-skeletons";

const AIGroupingSection = dynamic(
  () => import("@/components/ai/ai-grouping-section"),
  {
    loading: () => <CompanyAIFeatureSkeleton />,
  },
);

const DynamicFlashcardGenerator = dynamic(
  () => import("@/components/ai/flashcard-generator"),
  {
    loading: () => <CompanyAIFeatureSkeleton />,
  },
);

const CompanyStrategyGenerator = dynamic(
  () => import("@/components/ai/company-strategy-generator"),
  {
    loading: () => <CompanyStrategySkeleton />,
  },
);

const CompanyProblemStats = dynamic(
  () => import("@/components/company/company-problem-stats"),
  {
    loading: () => <CompanyStatsSkeleton />,
  },
);

interface CompanyTabsProps {
  company: Company;
  displayProblemCount: number;
  initialProblems: LeetCodeProblem[];
  initialHasMore: boolean;
  initialNextCursor: string | null | undefined;
  initialFilters: ProblemListFilters;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export default function CompanyTabs({
  company,
  displayProblemCount,
  initialProblems,
  initialHasMore,
  initialNextCursor,
  initialFilters,
  itemsPerPage,
  totalPages,
  currentPage,
}: CompanyTabsProps) {
  // Removed aiProblems state and eager fetching effect

  return (
    <Tabs defaultValue="problems" orientation="horizontal" className="w-full">
      <div className="w-full overflow-x-auto pb-2 scrollbar-hide transition-all duration-300 ease-in-out">
        <TabsList className="inline-flex w-auto justify-start h-auto p-1 bg-muted/50 rounded-lg transition-all duration-300 ease-in-out">
          <TabsTrigger value="problems" className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base whitespace-nowrap transition-all duration-300 ease-in-out">
            <BookOpen className="h-4 w-4 mr-2" />
            Problems
          </TabsTrigger>
          <TabsTrigger value="stats" className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base whitespace-nowrap transition-all duration-300 ease-in-out">
            <Brain className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="ai-grouping" className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base whitespace-nowrap transition-all duration-300 ease-in-out">
            <Brain className="h-4 w-4 mr-2" />
            AI Groups
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base whitespace-nowrap transition-all duration-300 ease-in-out">
            <Target className="h-4 w-4 mr-2" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="strategy" className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base whitespace-nowrap transition-all duration-300 ease-in-out">
            <Users className="h-4 w-4 mr-2" />
            Strategy
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="mt-4 md:mt-6 transition-all duration-300 ease-in-out">
        <TabsContent value="problems" className="mt-0 transition-all duration-300 ease-in-out">
          <ProblemList
            key={company.id}
            companyId={company.id}
            companySlug={company.slug}
            initialProblems={initialProblems}
            initialHasMore={initialHasMore ?? false}
            initialNextCursor={initialNextCursor ?? undefined}
            itemsPerPage={itemsPerPage}
            initialFilters={initialFilters}
            totalProblemCount={company.problemCount}
            difficultyCounts={company.difficultyCounts}
            totalPages={totalPages}
            currentPage={currentPage}
          />
        </TabsContent>
        <TabsContent value="stats" className="mt-0 transition-all duration-300 ease-in-out">
          <Suspense fallback={<CompanyStatsSkeleton />}>
            <CompanyProblemStats company={company} />
          </Suspense>
        </TabsContent>
        <TabsContent value="ai-grouping" className="mt-0 transition-all duration-300 ease-in-out">
          <AIGroupingSection
            companyId={company.id}
            companyName={company.name}
            companySlug={company.slug}
          />
        </TabsContent>
        <TabsContent value="flashcards" className="mt-0 transition-all duration-300 ease-in-out">
          <DynamicFlashcardGenerator
            companyId={company.id}
            companyName={company.name}
            companySlug={company.slug}
          />
        </TabsContent>
        <TabsContent value="strategy" className="mt-0 transition-all duration-300 ease-in-out">
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
