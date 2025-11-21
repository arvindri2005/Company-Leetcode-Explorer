/**
 * @fileoverview A redesigned, modern component for displaying a single coding problem.
 *
 * This component presents problem details in a clean, table-row-like format,
 * with clear visual indicators for difficulty, status, and bookmarked state.
 * It also includes buttons for AI-powered features and other user actions.
 */
"use client";

import type { LeetCodeProblem, ProblemStatus } from "@/types";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  CheckCircle,
  XCircle,
  Circle,
  ExternalLink,
  Bot,
  Sparkles,
  Lightbulb,
  Clock,
  TrendingUp,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TagBadge from "./tag-badge";
import { lastAskedPeriodDisplayMap } from "@/types";
import { useProblemInteractions } from "@/hooks/use-problem-interactions";
import { useAIFeatures } from "@/hooks/use-ai-features";
import { useAuth } from "@/contexts/auth-context";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";

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

interface ProblemCardProps {
  problem: LeetCodeProblem;
  companySlug: string;
  initialIsBookmarked?: boolean;
  onBookmarkChanged?: (problemId: string, isBookmarked: boolean) => void;
  problemStatus?: ProblemStatus;
  onProblemStatusChange?: (problemId: string, status: ProblemStatus) => void;
}

const difficultyStyles: Record<
  LeetCodeProblem["difficulty"],
  { text: string; bg: string }
> = {
  Easy: { text: "text-green-500", bg: "bg-green-500/10" },
  Medium: { text: "text-yellow-500", bg: "bg-yellow-500/10" },
  Hard: { text: "text-red-500", bg: "bg-red-500/10" },
};

const statusIcons: Record<ProblemStatus, React.ElementType> = {
  solved: CheckCircle,
  attempted: XCircle,
  none: Circle,
};

const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  companySlug,
  initialIsBookmarked = false,
  onBookmarkChanged,
  problemStatus = "none",
  onProblemStatusChange,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const StatusIcon = statusIcons[currentStatus];
  const problemTags = problem.tags || [];

  return (
    <>
      <div className="problem-card-v2 flex flex-col p-3 md:p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 md:gap-4">
          {/* Left Side: Status Icon & Title */}
          <div className="flex items-start gap-2 md:gap-4 min-w-0 flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 -ml-1 mt-0.5 md:mt-0">
                  <StatusIcon
                    className={cn("h-5 w-5", {
                      "text-green-500": currentStatus === "solved",
                      "text-red-500": currentStatus === "attempted",
                      "text-gray-500": currentStatus === "none",
                    })}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleStatusUpdate("solved")}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Solved
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusUpdate("attempted")}
                >
                  <XCircle className="h-4 w-4 mr-2 text-red-500" /> Attempted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate("none")}>
                  <Circle className="h-4 w-4 mr-2 text-gray-500" /> None
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-col min-w-0">
              <Link
                href={`/company/${companySlug}/problem/${problem.slug}`}
                className="font-semibold text-base md:text-lg hover:text-primary transition-colors break-words line-clamp-2 leading-tight"
              >
                {problem.title}
              </Link>
              {problem.lastAskedPeriod && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap mt-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {lastAskedPeriodDisplayMap[problem.lastAskedPeriod]}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Bookmark, Difficulty, Last Asked, Expand */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 self-start">
            <Badge
              className={cn(
                "text-xs md:text-sm font-semibold px-1.5 py-0.5 md:px-2.5 md:py-0.5 h-6 md:h-auto",
                difficultyStyles[problem.difficulty].bg,
                difficultyStyles[problem.difficulty].text,
              )}
            >
              {problem.difficulty}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleBookmark}
              disabled={isTogglingBookmark || !user}
              className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10"
            >
              {isTogglingBookmark ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bookmark
                  className={cn(
                    "h-4 w-4 md:h-5 md:w-5 text-gray-400",
                    isBookmarked && "fill-current text-primary",
                  )}
                />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
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

            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
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

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                size="sm"
                className="flex-1"
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
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault();
                  toast({
                    title: "Coming Soon",
                    description: "Mock interview feature is in development.",
                    variant: "default",
                  });
                }}
              >
                <Link href={"#"}>
                  <Bot className="h-4 w-4 mr-2" />
                  Mock
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
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
                className="flex-1 text-xs"
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
            </div>
          </div>
        )}
      </div>
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

export default ProblemCard;
