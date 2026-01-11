/**
 * @fileoverview A new card component for displaying problem details in the global problem list.
 *
 * This component displays comprehensive information about a problem, including:
 * - Title (linked)
 * - Difficulty
 * - Status
 * - Tags
 * - Companies (if available)
 * - Last Asked Period
 * - Actions (Bookmark, Solve)
 */
"use client";

import Link from "next/link";

import {
  Bookmark,
  Building2,
  CheckCircle,
  Circle,
  Clock,
  ExternalLink,
  ListTodo,
  Loader2,
  Tag,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProblemInteractions } from "@/features/problems/hooks/use-problem-interactions";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers";

import type { LeetCodeProblem, ProblemStatus } from "../../types";
import TagBadge from "../tag-badge/tag-badge";

interface ProblemInfoCardProps {
  problem: LeetCodeProblem;
  initialIsBookmarked?: boolean;
  onBookmarkChanged?: (problemId: string, isBookmarked: boolean) => void;
  problemStatus?: ProblemStatus;
  onProblemStatusChange?: (problemId: string, status: ProblemStatus) => void;
}

const difficultyStyles: Record<
  LeetCodeProblem["difficulty"],
  { text: string; bg: string; border: string }
> = {
  Easy: { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  Medium: { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  Hard: { text: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const statusIcons: Record<ProblemStatus, React.ElementType> = {
  solved: CheckCircle,
  attempted: XCircle,
  todo: ListTodo,
  none: Circle,
};

const ProblemInfoCard: React.FC<ProblemInfoCardProps> = ({
  problem,
  initialIsBookmarked = false,
  onBookmarkChanged,
  problemStatus = "none",
  onProblemStatusChange,
}) => {
  useAuth();
  
  // We use "unknown" as companySlug since this card is used in the global list
  // where we might not have a specific company context for the interaction hooks.
  // The hooks might need a slug for some operations, but for global bookmarks/status
  // it might be less critical or handled by the API.
  // However, useProblemInteractions takes companySlug. 
  // If we don't have a specific one, we might pass the problem's primary companySlug if available.
  const interactionCompanySlug = problem.companySlug || "unknown";

  const {
    isBookmarked,
    isTogglingBookmark,
    handleToggleBookmark,
    currentStatus,
    handleStatusUpdate,
  } = useProblemInteractions(
    problem,
    interactionCompanySlug,
    initialIsBookmarked,
    problemStatus,
    onBookmarkChanged,
    onProblemStatusChange,
  );

  const StatusIcon = statusIcons[currentStatus];
  const problemTags = problem.tags || [];
  const companyIds = problem.companyIds || [];

  return (
    <div className="group relative flex flex-col gap-4 p-5 bg-card hover:bg-muted/30 border rounded-xl transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header: Title & Status */}
          <div className="flex items-start gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8 -mt-1 -ml-2 text-muted-foreground hover:text-foreground"
                >
                  <StatusIcon
                    className={cn("h-5 w-5", {
                      "text-green-500": currentStatus === "solved",
                      "text-yellow-500": currentStatus === "attempted",
                      "text-blue-500": currentStatus === "todo",
                      "text-muted-foreground": currentStatus === "none",
                    })}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleStatusUpdate("solved")}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Solved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate("attempted")}>
                  <XCircle className="h-4 w-4 mr-2 text-yellow-500" /> Attempted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate("todo")}>
                  <ListTodo className="h-4 w-4 mr-2 text-blue-500" /> To-Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate("none")}>
                  <Circle className="h-4 w-4 mr-2 text-muted-foreground" /> None
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-col gap-1">
              <Link
                href={problem.link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-lg font-semibold leading-tight hover:text-primary transition-colors line-clamp-2"
              >
                {problem.title}
              </Link>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                 <Badge
                    variant="outline"
                    className={cn(
                      "font-medium border px-2 py-0.5 rounded-full",
                      difficultyStyles[problem.difficulty].text,
                      difficultyStyles[problem.difficulty].bg,
                      difficultyStyles[problem.difficulty].border
                    )}
                  >
                    {problem.difficulty}
                  </Badge>
                  
                  {problem.lastAskedPeriod && (
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{problem.lastAskedPeriod.replace(/_/g, " ")}</span>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Tags & Companies */}
          <div className="flex flex-col gap-2 pl-9">
             {problemTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                        {problemTags.slice(0, 5).map(tag => (
                            <TagBadge key={tag} tag={tag} className="text-xxs px-1.5 py-0 h-5" />
                        ))}
                        {problemTags.length > 5 && (
                            <span className="text-xs text-muted-foreground">+{problemTags.length - 5} more</span>
                        )}
                    </div>
                </div>
             )}
             
             {companyIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                        {companyIds.slice(0, 3).map(companyId => (
                            <Badge key={companyId} variant="secondary" className="text-xxs px-1.5 py-0 h-5 font-normal">
                                {companyId}
                            </Badge>
                        ))}
                         {companyIds.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{companyIds.length - 3} more</span>
                        )}
                    </div>
                </div>
             )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start md:justify-center"
            asChild
          >
            <a href={problem.link} target="_blank" rel="noopener noreferrer nofollow">
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Solve</span>
            </a>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleBookmark}
            disabled={isTogglingBookmark}
            className={cn(
                "w-full justify-start md:justify-center",
                isBookmarked ? "text-primary hover:text-primary/80" : "text-muted-foreground"
            )}
          >
             {isTogglingBookmark ? (
                <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
             )}
             <span className="hidden md:inline ml-2">{isBookmarked ? "Saved" : "Save"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProblemInfoCard;






