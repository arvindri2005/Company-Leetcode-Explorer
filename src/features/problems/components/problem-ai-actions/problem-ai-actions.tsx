"use client";

import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb } from "lucide-react";
import dynamic from "next/dynamic";
import { useAIFeatures } from "@/hooks/use-ai-features";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import { ToastAction } from "@/components/ui/toast";
import type { LeetCodeProblem } from "../../types";

const SimilarProblemsDialog = dynamic(
  () => import("@/components/ai/similar-problems-dialog"),
  {
    loading: () => <p>Loading dialog...</p>,
  },
);
const ProblemInsightsDialog = dynamic(
  () => import("@/components/ai/problem-insights-dialog"),
  {
    loading: () => <p>Loading dialog...</p>,
  },
);

interface ProblemAIActionsProps {
  problem: LeetCodeProblem;
  companySlug: string;
}

export const ProblemAIActions: React.FC<ProblemAIActionsProps> = ({
  problem,
  companySlug,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const {
    isLoadingSimilar,
    similarProblems,
    isSimilarDialogSharedOpen,
    setIsSimilarDialogSharedOpen,
    handleFindSimilar,
    isLoadingInsights,
    problemInsights,
    isInsightsDialogOpen,
    setIsInsightsDialogOpen,
    handleGenerateInsights,
  } = useAIFeatures(problem, companySlug);

  const promptLogin = () => {
    toast({
        title: "Authentication Required",
        description: "Please log in to use AI features.",
        className: "border-primary shadow-[0_0_25px_rgba(45,212,191,0.6)]",
        action: (
          <ToastAction
            altText="Login"
            className="bg-primary text-primary-foreground hover:bg-primary/90 border-none"
            onClick={() =>
              router.push(`/login?redirectUrl=${encodeURIComponent(pathname)}`)
            }
          >
            Login
          </ToastAction>
        ),
      });
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 text-sm md:text-base flex-1 bg-background hover:bg-muted border border-border/50"
        onClick={() => {
          if (!user) promptLogin();
          else handleFindSimilar();
        }}
        isLoading={isLoadingSimilar}
      >
        {!isLoadingSimilar && (
          <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-400" />
        )}
        Similar
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 text-sm md:text-base flex-1 bg-background hover:bg-muted border border-border/50"
        onClick={() => {
          if (!user) promptLogin();
          else handleGenerateInsights();
        }}
        isLoading={isLoadingInsights}
      >
        {!isLoadingInsights && (
          <Lightbulb className="h-3.5 w-3.5 mr-2 text-yellow-400" />
        )}
        Hints
      </Button>

      <Suspense fallback={null}>
        {isSimilarDialogSharedOpen && (
          <SimilarProblemsDialog
            isOpen={isSimilarDialogSharedOpen}
            onClose={() => setIsSimilarDialogSharedOpen(false)}
            currentProblemTitle={problem.title}
            similarProblems={similarProblems || []}
            isLoading={isLoadingSimilar}
          />
        )}
        {isInsightsDialogOpen && (
          <ProblemInsightsDialog
            isOpen={isInsightsDialogOpen}
            onClose={() => setIsInsightsDialogOpen(false)}
            problemTitle={problem.title}
            insights={problemInsights}
            isLoading={isLoadingInsights}
          />
        )}
      </Suspense>
    </>
  );
};






