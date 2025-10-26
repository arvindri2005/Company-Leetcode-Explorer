/**
 * @fileoverview A client-side component that organizes company details into interactive tabs.
 *
 * This component serves as the main content area for a company page. It uses a
 * tab-based layout to separate the list of problems from various AI-powered
 * features like question grouping, flashcard generation, and strategy creation.
 * It uses dynamic imports to lazy-load the AI feature components, improving
 * initial page load performance.
 */
"use client";

import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, Target, Users } from "lucide-react";
import ProblemList from "@/components/problem/problem-list";
import type { Company, LeetCodeProblem, ProblemListFilters } from "@/types";
import { getProblemsByCompanyFromDb } from "@/lib/data";

// Dynamically import AI components to reduce the initial bundle size.
// A custom loading skeleton is shown while the component is being fetched.
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

/**
 * Props for the CompanyTabs component.
 */
interface CompanyTabsProps {
  company: Company;
  displayProblemCount: number;
  initialProblems: LeetCodeProblem[];
  initialHasMore: boolean;
  initialNextCursor: string | null | undefined;
  initialFilters: ProblemListFilters;
  itemsPerPage: number;
}

/**
 * Renders a tabbed interface for a company's problems and AI-powered tools.
 *
 * This component sets up the main content area of a company page, organizing
 * different features into selectable tabs. It fetches a separate, potentially larger,
 * list of problems specifically for the AI features to ensure they have enough
 * context to provide meaningful results, without slowing down the initial problem list display.
 *
 * @param {CompanyTabsProps} props - The props for the component.
 * @returns {JSX.Element} The rendered tabbed component.
 */
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
  // isLoadingAI state is kept for potential use with other AI components
  const [isLoadingAI, setIsLoadingAI] = useState(true);

  useEffect(() => {
    async function fetchAIProblems() {
      setIsLoadingAI(true);
      try {
        const { problems } = await getProblemsByCompanyFromDb(company.id, {
          pageSize: MAX_PROBLEMS_FOR_AI_FEATURES,
        });
        setAiProblems(problems);
      } catch (error) {
        console.error("Failed to fetch problems for AI features:", error);
      } finally {
        setIsLoadingAI(false);
      }
    }

    if (company.id) {
      fetchAIProblems();
    }
  }, [company.id]);

  return (
    <>
      <div className="mb-4">
        <Suspense
          fallback={<div className="animate-pulse h-36 bg-muted rounded-lg" />}
        >
          <CompanyProblemStats company={company} />
        </Suspense>
      </div>
      <Tabs defaultValue="problems" className="w-full">
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TabsList className="bg-card border border-border rounded-xl shadow-sm grid grid-cols-4 h-10 w-full overflow-hidden">
              <TabsTrigger value="problems" className="text-xs px-2 rounded-lg">
                <BookOpen className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Problems</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai-grouping"
                className="text-xs px-2 rounded-lg"
              >
                <Brain className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">AI Groups</span>
              </TabsTrigger>
              <TabsTrigger
                value="flashcards"
                className="text-xs px-2 rounded-lg"
              >
                <Target className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Cards</span>
              </TabsTrigger>
              <TabsTrigger value="strategy" className="text-xs px-2 rounded-lg">
                <Users className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Strategy</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="problems" className="mt-0">
          <Card className="bg-card border border-border rounded-xl  mb-8 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                Coding Interview Problems for {company.name}
                <Badge variant="outline" className="text-xs">
                  {displayProblemCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Suspense
                fallback={
                  <div className="animate-pulse h-48 bg-muted rounded" />
                }
              >
                <ProblemList
                  key={company.id}
                  companyId={company.id}
                  companySlug={company.slug}
                  initialProblems={initialProblems}
                  initialHasMore={initialHasMore ?? false}
                  initialNextCursor={initialNextCursor}
                  itemsPerPage={itemsPerPage}
                  initialFilters={initialFilters}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-grouping" className="mt-0">
          <Card className="bg-card border border-border rounded-xl  mb-8 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4" />
                AI-Powered Problem Grouping for {company.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Suspense
                fallback={
                  <div className="animate-pulse h-48 bg-muted rounded" />
                }
              >
                <AIGroupingSection
                  problems={aiProblems}
                  companyName={company.name}
                  companySlug={company.slug}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards" className="mt-0">
          <Card className="bg-card border border-border rounded-xl  mb-8 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Study Flashcards for {company.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Suspense
                fallback={
                  <div className="animate-pulse h-48 bg-muted rounded" />
                }
              >
                <DynamicFlashcardGenerator
                  companyId={company.id}
                  companyName={company.name}
                  companySlug={company.slug}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="mt-0">
          <Card className="bg-card border border-border rounded-xl  mb-8 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Interview Strategy for {company.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Suspense
                fallback={
                  <div className="animate-pulse h-48 bg-muted rounded" />
                }
              >
                <CompanyStrategyGenerator
                  companyId={company.id}
                  companyName={company.name}
                  companySlug={company.slug}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
