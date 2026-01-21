/**
 * @fileoverview A redesigned, modern component for displaying a single coding problem.
 *
 * This component presents problem details in a clean, table-row-like format,
 * with clear visual indicators for difficulty, status, and bookmarked state.
 * It also includes buttons for AI-powered features and other user actions.
 */
"use client";

import React, { useMemo, useState } from "react";

import Link from "next/link";

import {
  Bookmark,
  CheckCircle,
  ChevronDown,
  Circle,
  Clock,
  ExternalLink,
  ListTodo,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProblemInteractions } from "@/features/problems/hooks/use-problem-interactions";
import { cn, getDeterministicRandom } from "@/lib/utils";

import type { LeetCodeProblem, ProblemStatus } from "../../types";
import CompanyBadge from "../company-badge/company-badge";
import { ProblemAIActions } from "../problem-ai-actions";
import TagBadge from "../tag-badge/tag-badge";

interface ProblemCardProps {
  problem: LeetCodeProblem;
  companySlug: string;
  initialIsBookmarked?: boolean;
  onBookmarkChanged?: (problemId: string, isBookmarked: boolean) => void;
  problemStatus?: ProblemStatus;
  onProblemStatusChange?: (problemId: string, status: ProblemStatus) => void;
  showCompanies?: boolean;
  userId?: string;
}

const statusIcons: Record<ProblemStatus, React.ElementType> = {
  solved: CheckCircle,
  attempted: XCircle,
  todo: ListTodo,
  none: Circle,
};

// Optimization: Move static lookups outside component to avoid re-creation and switch logic on every render
const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Hard: "text-rose-500 bg-rose-500/10 border-rose-500/20",
};
const DEFAULT_DIFFICULTY_COLOR =
  "text-slate-500 bg-slate-500/10 border-slate-500/20";

const STATUS_COLORS: Partial<Record<ProblemStatus, string>> = {
  solved: "text-emerald-500",
  attempted: "text-amber-500",
};
const DEFAULT_STATUS_COLOR =
  "text-muted-foreground/40 group-hover:text-muted-foreground/60";

const EMPTY_TAGS: string[] = [];

const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  companySlug,
  initialIsBookmarked = false,
  onBookmarkChanged,
  problemStatus = "none",
  onProblemStatusChange,
  showCompanies = false,
  userId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Optimization: Lazy load AI hooks/components only after first interaction
  const [wasEverExpanded, setWasEverExpanded] = useState(false);

  const handleToggleExpand = React.useCallback(() => {
    if (!wasEverExpanded) {
      setWasEverExpanded(true);
    }
    setIsExpanded((prev) => !prev);
  }, [wasEverExpanded]);

  const {
    isBookmarked,
    isTogglingBookmark,
    handleToggleBookmark,
    currentStatus,
    isUpdatingStatus,
    handleStatusUpdate,
  } = useProblemInteractions(
    problem,
    companySlug,
    initialIsBookmarked,
    problemStatus,
    userId,
    onBookmarkChanged,
    onProblemStatusChange,
  );

  const onBookmarkClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleToggleBookmark();
    },
    [handleToggleBookmark],
  );

  const onExpandClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleToggleExpand();
    },
    [handleToggleExpand],
  );

  const displayTime = useMemo(() => {
    let time = "";
    if (problem.lastAskedPeriod) {
      // Use deterministic random based on problem ID to prevent hydration mismatch
      const rand = getDeterministicRandom(problem.id);
      switch (problem.lastAskedPeriod) {
        case "last_30_days":
          time = `${Math.floor(rand * 30) + 1}d ago`;
          break;
        case "within_3_months":
          time = `${Math.floor(rand * 3) + 1}mo ago`;
          break;
        case "within_6_months":
          time = `${Math.floor(rand * 3) + 3}mo ago`;
          break;
        case "older_than_6_months":
          time = `${Math.floor(rand * 6) + 6}mo ago`;
          break;
        default:
          time = "";
      }
    }
    return time;
  }, [problem.lastAskedPeriod, problem.id]);

  const StatusIcon = statusIcons[currentStatus];

  // Optimization: Simple lookup is O(1) and avoids switch statement overhead
  const difficultyColor =
    DIFFICULTY_COLORS[problem.difficulty] || DEFAULT_DIFFICULTY_COLOR;
  const statusColor = STATUS_COLORS[currentStatus] || DEFAULT_STATUS_COLOR;

  // Optimization: Use stable empty array to prevent unnecessary re-renders of children
  const problemTags = problem.tags || EMPTY_TAGS;

  return (
    <div className="group relative">
      <div
        className="flex flex-col bg-card hover:bg-muted/40 border border-border/40 hover:border-border/80 rounded-lg transition-all duration-200 overflow-hidden cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center gap-3 p-3 md:p-4">
          {/* Status Toggle */}
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <TooltipProvider delayDuration={300}>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        isLoading={isUpdatingStatus}
                        className="h-11 w-11 md:h-9 md:w-9 hover:bg-primary/5 rounded-full"
                        aria-label={`Change status. Current status: ${currentStatus}`}
                      >
                        <StatusIcon
                          className={cn(
                            "h-5 w-5 transition-colors",
                            statusColor,
                          )}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change status</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuCheckboxItem
                    checked={currentStatus === "solved"}
                  onCheckedChange={() => handleStatusUpdate("solved")}
                  className="text-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />{" "}
                  Solved
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={currentStatus === "attempted"}
                  onCheckedChange={() => handleStatusUpdate("attempted")}
                  className="text-sm"
                >
                  <XCircle className="h-4 w-4 mr-2 text-amber-500" /> Attempted
                </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={currentStatus === "none"}
                    onCheckedChange={() => handleStatusUpdate("none")}
                    className="text-sm"
                  >
                    <ListTodo className="h-4 w-4 mr-2 text-slate-500" /> To Do
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
          </div>

          {/* Title & Key Info */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link
                href={problem.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base md:text-lg font-medium text-foreground hover:text-primary transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
                aria-label={`${problem.title} (opens in a new tab)`}
              >
                {problem.title}
              </Link>
              <span
                className={cn(
                  "text-xs md:text-sm px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider",
                  difficultyColor,
                )}
              >
                {problem.difficulty}
              </span>
            </div>

            {/* Companies (Compact) */}
            {showCompanies &&
              problem.companyIds &&
              problem.companyIds.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {problem.companyIds.map((companyId) => (
                    <CompanyBadge key={companyId} companyId={companyId} />
                  ))}
                </div>
              )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {problem.lastAskedPeriod && (
              <div className="hidden sm:flex items-center gap-1 text-xs md:text-sm text-muted-foreground mr-3">
                <Clock className="h-3.5 w-3.5" />
                <span>{displayTime}</span>
              </div>
            )}

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBookmarkClick}
                    isLoading={isTogglingBookmark}
                    className="h-11 w-11 md:h-9 md:w-9 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    aria-label={
                      isBookmarked
                        ? "Remove from bookmarks"
                        : "Add to bookmarks"
                    }
                  >
                    {!isTogglingBookmark && (
                      <Bookmark
                        className={cn(
                          "h-4 w-4",
                          isBookmarked && "fill-primary text-primary",
                        )}
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isBookmarked
                      ? "Remove from bookmarks"
                      : "Add to bookmarks"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onExpandClick}
                    className={cn(
                      "h-11 w-11 md:h-9 md:w-9 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                    aria-label={
                      isExpanded ? "Collapse details" : "Expand details"
                    }
                    aria-expanded={isExpanded}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? "Collapse details" : "Expand details"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Expanded Content */}
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out bg-muted/20",
            isExpanded
              ? "grid-rows-[1fr] border-t border-border/40"
              : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            {wasEverExpanded && (
              <div className="p-3 pt-2 flex flex-col gap-3">
                {/* Tags */}
                {problemTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {problemTags.map((tag) => (
                      <TagBadge
                        key={tag}
                        tag={tag}
                        className="bg-background border-border/50 text-xs md:text-sm px-2 py-0.5 h-auto text-muted-foreground"
                      />
                    ))}
                  </div>
                )}

                {/* Compact Actions Row */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-sm md:text-base flex-1 bg-background hover:bg-muted border border-border/50"
                    asChild
                  >
                    <Link
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Solve on LeetCode (opens in a new tab)"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      Write Code
                    </Link>
                  </Button>

                  <ProblemAIActions
                    problem={problem}
                    companySlug={companySlug}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProblemCard);
