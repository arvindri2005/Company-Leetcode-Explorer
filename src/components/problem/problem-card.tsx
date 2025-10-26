/**
 * @fileoverview Defines a highly interactive card component for displaying a single coding problem.
 *
 * This client-side component renders all details for a coding problem and includes
 * numerous interactive elements for user engagement. This includes bookmarking,
 * setting problem status, and triggering various AI-powered features like finding
 * similar problems and generating hints.
 */
"use client";

import type {
  LeetCodeProblem,
  ProblemStatus,
  SimilarProblemDetail,
  GenerateProblemInsightsOutput,
} from "@/types";
import {
  lastAskedPeriodDisplayMap,
  PROBLEM_STATUS_OPTIONS,
  PROBLEM_STATUS_DISPLAY,
} from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import DifficultyBadge from "./difficulty-badge";
import TagBadge from "./tag-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ExternalLink,
  Tag,
  Sparkles,
  Loader2,
  Bot,
  Star,
  CheckCircle2,
  Pencil,
  ListTodo,
  MoreVertical,
  Lightbulb,
  Clock,
  TrendingUp,
  Zap,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";
import {
  performSimilarQuestionSearch,
  toggleBookmarkProblemAction,
  setProblemStatusAction,
  generateProblemInsightsAction,
} from "@/app/actions";
import { useAuth } from "@/contexts/auth-context";
import { useAICooldown } from "@/hooks/use-ai-cooldown";
import { useAIFeatures } from "@/hooks/use-ai-features";
import { useProblemInteractions } from "@/hooks/use-problem-interactions";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import type { User as FirebaseUser } from "firebase/auth";
import { ProblemStatusIcon } from "./problem-status-icon";
import { AITooltipContent } from "./ai-tooltip-content";

// Dynamically import dialogs to avoid including them in the initial bundle.
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

/**
 * Props for the ProblemCard component.
 */
interface ProblemCardProps {
  problem: LeetCodeProblem;
  companySlug: string;
  initialIsBookmarked?: boolean;
  onBookmarkChanged?: (problemId: string, newStatus: boolean) => void;
  problemStatus?: ProblemStatus;
  onProblemStatusChange?: (problemId: string, newStatus: ProblemStatus) => void;
}

/**
 * Renders an icon representing the user's progress status for a problem.


/**
 * Renders a detailed and highly interactive card for a single coding problem.
 *
 * This component is a central piece of the UI, displaying problem details like
 * title, difficulty, and tags. It provides numerous user actions:
 * - Link to solve the problem externally.
 * - Button to start a mock interview (feature in development).
 * - AI-powered tools to find similar problems and generate hints/insights.
 * - User-specific actions like bookmarking and setting a progress status (e.g., Solved, To-Do).
 *
 * It manages its own state for these interactions and communicates changes
 * back to parent components via callbacks.
 *
 * @param {ProblemCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered problem card.
 */
const ProblemCardComponent: React.FC<ProblemCardProps> = ({
  problem,
  companySlug,
  initialIsBookmarked = false,
  onBookmarkChanged,
  problemStatus = "none",
  onProblemStatusChange,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canUseAI, startCooldown, formattedRemainingTime, isLoadingCooldown } =
    useAICooldown();
  const router = useRouter();
  const pathname = usePathname();

  const {
    isBookmarked,
    isTogglingBookmark,
    handleToggleBookmark,
    currentStatus,
    isUpdatingStatus,
    handleStatusUpdate,
    redirectToLogin,
  } = useProblemInteractions(
    problem,
    companySlug,
    initialIsBookmarked,
    problemStatus,
    onBookmarkChanged,
    onProblemStatusChange,
  );

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

  const isUserActionDisabled = !user;
  const isAIActionDisabled =
    isUserActionDisabled || isLoadingCooldown || !canUseAI;
  const cooldownToastMessage = `AI features are on cooldown. Please wait ${formattedRemainingTime} before using another AI feature.`;

  const problemTags = problem.tags || [];

  return (
    <>
      <Card
        className={cn(
          "flex flex-col h-full",
          "bg-card border border-border/50 rounded-2xl shadow-sm",
          "transition-all duration-300 ease-in-out",
          "hover:shadow-md hover:border-primary/30",
        )}
      >
        <CardHeader className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {user && <ProblemStatusIcon status={currentStatus} />}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-card-foreground leading-snug">
                  {problem.title}
                </CardTitle>
                {problem.lastAskedPeriod && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {lastAskedPeriodDisplayMap[problem.lastAskedPeriod]}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <DifficultyBadge difficulty={problem.difficulty} />
              {user && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleBookmark}
                        disabled={isTogglingBookmark || isUserActionDisabled}
                        className="h-8 w-8 rounded-full"
                        aria-label={
                          isBookmarked
                            ? `Remove bookmark for ${problem.title}`
                            : `Add bookmark for ${problem.title}`
                        }
                      >
                        {isTogglingBookmark ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star
                            className={cn(
                              "h-5 w-5 transition-all duration-200",
                              isBookmarked
                                ? "fill-yellow-400 text-yellow-500"
                                : "text-muted-foreground hover:text-yellow-400",
                            )}
                          />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isBookmarked
                          ? "Remove Bookmark"
                          : isUserActionDisabled
                            ? "Login to bookmark"
                            : "Add Bookmark"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-grow">
          {problemTags.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {problemTags.slice(0, 4).map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
                {problemTags.length > 4 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{problemTags.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              <span>Trending</span>
            </div>
            {problem.lastAskedPeriod && (
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                <span>Recent</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col items-stretch gap-2">
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              className="flex-1 rounded-full"
              disabled={!problem.link}
              onClick={() => {
                if (problem.link) {
                  window.open(problem.link, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Solve
            </Button>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="flex-1 rounded-full"
            >
              <Link
                href={"#"}
                aria-disabled={isUserActionDisabled}
                onClick={(e) => {
                  e.preventDefault();
                  toast({
                    title: "Coming Soon",
                    description: "Mock interview feature is in development.",
                    variant: "default",
                  });
                }}
              >
                <Bot className="h-4 w-4 mr-2" />
                Mock
              </Link>
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs rounded-full"
              onClick={() => {
                if (!user) {
                  redirectToLogin();
                  return;
                }
                handleFindSimilar();
              }}
              disabled={isLoadingSimilar}
            >
              {isLoadingSimilar ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Similar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs rounded-full"
              onClick={() => {
                if (!user) {
                  redirectToLogin();
                  return;
                }
                handleGenerateInsights();
              }}
              disabled={isLoadingInsights}
            >
              {isLoadingInsights ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Lightbulb className="h-4 w-4 mr-2" />
              )}
              Hints
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 rounded-full"
                    disabled={isUpdatingStatus || isUserActionDisabled}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Progress Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {PROBLEM_STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onSelect={() => handleStatusUpdate(opt.value)}
                      disabled={currentStatus === opt.value || isUpdatingStatus}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardFooter>
      </Card>

      <Suspense fallback={<div>Loading Dialog...</div>}>
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

const ProblemCard = React.memo(ProblemCardComponent);
export default ProblemCard;
