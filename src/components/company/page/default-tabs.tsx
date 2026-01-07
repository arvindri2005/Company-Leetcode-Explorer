import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Brain, Target, Users } from "lucide-react";
import { companyTabRegistry, CompanyTabContext } from "@/lib/company-tab-registry";
import ProblemList from "@/components/problem/problem-list";
import {
  CompanyAIFeatureSkeleton,
  CompanyStrategySkeleton,
  CompanyStatsSkeleton,
} from "@/components/skeletons/company-ai-skeletons";

// Dynamic imports to maintain code splitting and performance
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

// Register Core Tabs

// 1. Problems Tab
companyTabRegistry.register({
  id: "problems",
  label: "Problems",
  icon: BookOpen,
  order: 10,
  render: (context: CompanyTabContext) => (
    <ProblemList
      key={context.company.id}
      companyId={context.company.id}
      companySlug={context.company.slug}
      initialProblems={context.initialProblems}
      initialHasMore={context.initialHasMore}
      initialNextCursor={context.initialNextCursor ?? undefined}
      itemsPerPage={context.itemsPerPage}
      initialFilters={context.initialFilters}
      totalProblemCount={context.company.problemCount}
      difficultyCounts={context.company.difficultyCounts}
      totalPages={context.totalPages}
      currentPage={context.currentPage}
    />
  ),
});

// 2. Statistics Tab
companyTabRegistry.register({
  id: "stats",
  label: "Statistics",
  icon: Brain,
  order: 20,
  render: (context: CompanyTabContext) => (
    <Suspense fallback={<CompanyStatsSkeleton />}>
      <CompanyProblemStats company={context.company} />
    </Suspense>
  ),
});

// 3. AI Groups Tab
companyTabRegistry.register({
  id: "ai-grouping",
  label: "AI Groups",
  icon: Brain,
  order: 30,
  render: (context: CompanyTabContext) => (
    <AIGroupingSection
      companyId={context.company.id}
      companyName={context.company.name}
      companySlug={context.company.slug}
    />
  ),
});

// 4. Flashcards Tab
companyTabRegistry.register({
  id: "flashcards",
  label: "Flashcards",
  icon: Target,
  order: 40,
  render: (context: CompanyTabContext) => (
    <DynamicFlashcardGenerator
      companyId={context.company.id}
      companyName={context.company.name}
      companySlug={context.company.slug}
    />
  ),
});

// 5. Strategy Tab
companyTabRegistry.register({
  id: "strategy",
  label: "Strategy",
  icon: Users,
  order: 50,
  render: (context: CompanyTabContext) => (
    <CompanyStrategyGenerator
      companyId={context.company.id}
      companyName={context.company.name}
      companySlug={context.company.slug}
    />
  ),
});

// Export nothing, this file is for side-effects (registration)
export default function registerDefaultTabs() {
    // This function can be called to ensure registration happens,
    // though top-level execution also works if imported.
}
