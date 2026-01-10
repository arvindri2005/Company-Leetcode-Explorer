"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers";
import { useAICooldown } from "@/features/ai";
import {
  performSimilarQuestionSearch,
  generateProblemInsightsAction,
} from "@/app/actions/ai.actions";
import type {
  SimilarProblemDetail,
  GenerateProblemInsightsOutput,
  LeetCodeProblem,
} from "@/types";

export function useAIFeatures(problem: LeetCodeProblem, companySlug: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canUseAI, startCooldown, getFormattedRemainingTime, isLoadingCooldown } =
    useAICooldown();

  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [similarProblems, setSimilarProblems] = useState<
    SimilarProblemDetail[] | null
  >(null);
  const [isSimilarDialogSharedOpen, setIsSimilarDialogSharedOpen] =
    useState(false);

  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [problemInsights, setProblemInsights] =
    useState<GenerateProblemInsightsOutput | null>(null);
  const [isInsightsDialogOpen, setIsInsightsDialogOpen] = useState(false);

  const handleFindSimilar = async () => {
    if (!user) return;
    if (isLoadingCooldown || !canUseAI) {
      toast({
        title: "AI Feature on Cooldown",
        description: `AI features are on cooldown. Please wait ${getFormattedRemainingTime()} before using another AI feature.`,
        variant: "default",
      });
      return;
    }
    setIsLoadingSimilar(true);
    setSimilarProblems(null);
    setIsSimilarDialogSharedOpen(true);

    const result = await performSimilarQuestionSearch(
      problem.slug,
      problem.companySlug || companySlug,
    );
    setIsLoadingSimilar(false);

    if (result && "error" in result) {
      toast({
        title: "Search Failed",
        description: result.error,
        variant: "destructive",
      });
    } else if (result && result.similarProblems) {
      setSimilarProblems(result.similarProblems);
      startCooldown();
      toast({
        title: "✨ Similar Problems Found!",
        description: `Discovered ${result.similarProblems.length} related problem(s).`,
      });
    } else {
      setSimilarProblems([]);
      startCooldown();
      toast({
        title: "No Matches Found",
        description: "This problem appears to be unique!",
      });
    }
  };

  const handleGenerateInsights = async () => {
    if (!user) return;
    if (isLoadingCooldown || !canUseAI) {
      toast({
        title: "AI Feature on Cooldown",
        description: `AI features are on cooldown. Please wait ${getFormattedRemainingTime()} before using another AI feature.`,
        variant: "default",
      });
      return;
    }
    setIsLoadingInsights(true);
    setProblemInsights(null);
    setIsInsightsDialogOpen(true);

    const result = await generateProblemInsightsAction(problem);
    setIsLoadingInsights(false);

    if (result && "error" in result) {
      toast({
        title: "Insights Generation Failed",
        description: result.error,
        variant: "destructive",
      });
    } else if (result) {
      setProblemInsights(result);
      startCooldown();
      toast({
        title: "💡 Insights Ready!",
        description: "AI has analyzed the problem structure and hints.",
      });
    } else {
      toast({
        title: "Generation Error",
        description: "Could not generate insights for this problem.",
        variant: "destructive",
      });
    }
  };

  return {
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
  };
}






