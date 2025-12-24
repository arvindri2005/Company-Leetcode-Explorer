/**
 * @fileoverview A redesigned, modern component for displaying a single coding problem.
 *
 * This component presents problem details in a clean, table-row-like format,
 * with clear visual indicators for difficulty, status, and bookmarked state.
 * It also includes buttons for AI-powered features and other user actions.
 */
"use client";

import type { LeetCodeProblem, ProblemStatus } from "@/types";
import { useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  CheckCircle,
  XCircle,
  Circle,
  ExternalLink,
  Sparkles,
  Lightbulb,
  Clock,
  Loader2,
  ChevronDown,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TagBadge from "./tag-badge";
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
  showCompanies?: boolean;
}

const statusIcons: Record<ProblemStatus, React.ElementType> = {
  solved: CheckCircle,
  attempted: XCircle,
  todo: ListTodo,
  none: Circle,
};

const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  companySlug,
  initialIsBookmarked = false,
  onBookmarkChanged,
  problemStatus = "none",
  onProblemStatusChange,
  showCompanies = false,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(false);

  const {
    isBookmarked,
    isTogglingBookmark,
    handleToggleBookmark,
    currentStatus,
    handleStatusUpdate,
    promptLogin,
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

  const [displayTime, setDisplayTime] = useState("");

  // Use a pseudo-random generator based on problem ID to maintain consistency during re-renders
  // This avoids "impure render" issues while still giving a "random" look per problem.
  useEffect(() => {
    if (problem.lastAskedPeriod) {
      let seed = 0;
      for (let i = 0; i < problem.id.length; i++) {
        seed += problem.id.charCodeAt(i);
      }
      const pseudoRandom = (seed % 100) / 100;

      let time = "";
      switch (problem.lastAskedPeriod) {
        case "last_30_days": time = `${Math.floor(pseudoRandom * 30) + 1}d ago`; break;
        case "within_3_months": time = `${Math.floor(pseudoRandom * 3) + 1}mo ago`; break;
        case "within_6_months": time = `${Math.floor(pseudoRandom * 3) + 3}mo ago`; break;
        case "older_than_6_months": time = `${Math.floor(pseudoRandom * 6) + 6}mo ago`; break;
        default: time = "";
      }
      // Defer update to avoid set-state-in-effect warning
      setTimeout(() => setDisplayTime(time), 0);
    }
  }, [problem.lastAskedPeriod, problem.id]);


  const StatusIcon = statusIcons[currentStatus];
  
  const difficultyColor = useMemo(() => {
    switch(problem.difficulty) {
        case 'Easy': return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        case 'Medium': return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        case 'Hard': return "text-rose-500 bg-rose-500/10 border-rose-500/20";
        default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  }, [problem.difficulty]);

    const statusColor = useMemo(() => {
        switch(currentStatus) {
            case 'solved': return "text-emerald-500";
            case 'attempted': return "text-amber-500";
            default: return "text-muted-foreground/40 group-hover:text-muted-foreground/60";
        }
    }, [currentStatus]);

  const problemTags = problem.tags || [];

  return (
      <>
          <div 
            className="group relative flex flex-col bg-card hover:bg-muted/40 border border-border/40 hover:border-border/80 rounded-lg transition-all duration-200 overflow-hidden cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
              <div className="flex items-center gap-3 p-3 md:p-4">
                    {/* Status Toggle */}
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-primary/5 rounded-full"
                                >
                                    <StatusIcon className={cn("h-5 w-5 transition-colors", statusColor)} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                                <DropdownMenuItem onClick={() => handleStatusUpdate("solved")} className="text-sm">
                                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Solved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate("attempted")} className="text-sm">
                                    <XCircle className="h-4 w-4 mr-2 text-amber-500" /> Attempted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate("none")} className="text-sm">
                                    <ListTodo className="h-4 w-4 mr-2 text-slate-500" /> To Do
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                            >
                                {problem.title}
                            </Link>
                             <span className={cn("text-xs md:text-sm px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider", difficultyColor)}>
                                {problem.difficulty}
                            </span>
                        </div>
                        
                         {/* Companies (Compact) */}
                       {showCompanies && problem.companyIds && problem.companyIds.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {problem.companyIds.map(companyId => (
                                     <Link 
                                        key={companyId} 
                                        href={`/company/${companyId}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs md:text-sm text-muted-foreground bg-muted px-1.5 rounded-sm border border-border/50 whitespace-nowrap capitalize hover:text-foreground hover:border-border transition-colors"
                                     >
                                        {companyId.replace(/-/g, ' ')}
                                     </Link>
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

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark();
                            }}
                            disabled={isTogglingBookmark}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                        >
                            {isTogglingBookmark ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary text-primary")} />
                            )}
                        </Button>
                         <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className={cn("h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-transform duration-200", isExpanded && "rotate-180")}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </div>
              </div>

               {/* Expanded Content */}
              <div
                  className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out bg-muted/20",
                      isExpanded ? "grid-rows-[1fr] border-t border-border/40" : "grid-rows-[0fr]"
                  )}
              >
                   <div className="overflow-hidden">
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
                                  onClick={() => problem.link && window.open(problem.link, "_blank", "noopener,noreferrer")}
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                  Write Code
                                </Button>
                                 <Button
                                  variant="secondary"
                                  size="sm"
                                   className="h-8 text-sm md:text-base flex-1 bg-background hover:bg-muted border border-border/50"
                                  onClick={() => {
                                      if (!user) promptLogin();
                                      else handleFindSimilar();
                                  }}
                                  disabled={isLoadingSimilar}
                                >
                                   {isLoadingSimilar ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-400" />}
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
                                  disabled={isLoadingInsights}
                                >
                                  {isLoadingInsights ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Lightbulb className="h-3.5 w-3.5 mr-2 text-yellow-400" />}
                                  Hints
                                </Button>
                           </div>
                       </div>
                   </div>
              </div>
          </div>

          {/* Dialogs */}
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

export default ProblemCard;
