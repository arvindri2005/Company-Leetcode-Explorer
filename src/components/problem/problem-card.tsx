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
  Bot,
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
    isUpdatingStatus,
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

  const { displayTime, showTrending } = useMemo(() => {
    let time = "";
    if (problem.lastAskedPeriod) {
      switch (problem.lastAskedPeriod) {
        case "last_30_days":
          time = `${Math.floor(Math.random() * 30) + 1} days ago`;
          break;
        case "within_3_months":
          time = `${Math.floor(Math.random() * 3) + 1} months ago`;
          break;
        case "within_6_months":
          time = `${Math.floor(Math.random() * 3) + 3} months ago`;
          break;
        case "older_than_6_months":
          time = `${Math.floor(Math.random() * 6) + 6} months ago`;
          break;
        default:
          time = "";
      }
    }
    return {
      displayTime: time,
      showTrending: Math.random() > 0.5,
    };
  }, [problem.lastAskedPeriod]);

  const StatusIcon = statusIcons[currentStatus];
  // Calculate specific colors for difficulty with new palette
  const difficultyColor = useMemo(() => {
    switch(problem.difficulty) {
        case 'Easy': return "text-emerald-400 border-emerald-400/20 bg-emerald-400/5";
        case 'Medium': return "text-amber-400 border-amber-400/20 bg-amber-400/5";
        case 'Hard': return "text-rose-400 border-rose-400/20 bg-rose-400/5";
        default: return "text-slate-400 border-slate-400/20 bg-slate-400/5";
    }
  }, [problem.difficulty]);

    // Handle problem status color
    const statusColor = useMemo(() => {
        switch(currentStatus) {
            case 'solved': return "text-emerald-500";
            case 'attempted': return "text-amber-500";
            default: return "text-muted-foreground/60 group-hover:text-muted-foreground/80";
        }
    }, [currentStatus]);

  const problemTags = problem.tags || [];

  return (
      <>
          <div 
            className="group relative flex flex-col bg-card/40 hover:bg-card/60 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
          >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="relative p-4 md:p-5 flex flex-col gap-3">
                {/* Main Row */}
                <div className="flex items-start gap-3 md:gap-5">
                    {/* Status Indicator */}
                    <div className="pt-1 flex-shrink-0">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <StatusIcon className={cn("h-5 w-5 transition-colors", statusColor)} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40 bg-card/95 backdrop-blur-xl border-white/10">
                                <DropdownMenuItem onClick={() => handleStatusUpdate("solved")} className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> Solved
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate("attempted")} className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                                    <XCircle className="h-4 w-4 mr-2 text-amber-500" /> Attempted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate("none")} className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                                    <ListTodo className="h-4 w-4 mr-2 text-slate-500" /> To Do
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-4">
                            <Link
                                href={problem.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base md:text-lg font-medium text-foreground/90 group-hover:text-primary transition-colors line-clamp-2 leading-snug"
                            >
                                {problem.title}
                            </Link>

                            {/* Mobile Difficulty Badge (Visible only on small screens) */}
                             <div className={cn("md:hidden flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider", difficultyColor)}>
                                {problem.difficulty}
                             </div>
                        </div>

                         {/* Companies & Meta */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-3">
                            {showCompanies && problem.companyIds && problem.companyIds.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {(isCompaniesExpanded ? problem.companyIds : problem.companyIds.slice(0, 3)).map(companyId => (
                                        <Link 
                                            key={companyId} 
                                            href={`/company/${companyId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="group/badge"
                                        >
                                            <Badge 
                                                variant="outline" 
                                                className="bg-primary/5 text-primary/80 border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-[10px] px-2 py-0 h-5 lowercase font-normal"
                                            >
                                                {companyId}
                                            </Badge>
                                        </Link>
                                    ))}
                                     {problem.companyIds.length > 3 && (
                                       <button 
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setIsCompaniesExpanded(!isCompaniesExpanded);
                                          }}
                                          className="text-[10px] px-1.5 py-0.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                       >
                                          {isCompaniesExpanded ? "less" : `+${problem.companyIds.length - 3}`}
                                       </button>
                                    )}
                                </div>
                            ) : null}
                            
                            {/* Last Asked / Trending Meta */}
                            {problem.lastAskedPeriod && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                                   <Clock className="h-3 w-3" />
                                   <span>{displayTime}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop Actions (Hidden on Mobile) */}
                    <div className="hidden md:flex flex-col items-end gap-2 flex-shrink-0 pl-2">
                        <div className={cn("text-xs px-2.5 py-1 rounded-md border font-medium uppercase tracking-wider mb-1", difficultyColor)}>
                            {problem.difficulty}
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleToggleBookmark}
                                disabled={isTogglingBookmark}
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                                {isTogglingBookmark ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Bookmark className={cn("h-4 w-4 transition-colors", isBookmarked && "fill-primary text-primary")} />
                                )}
                            </Button>
                             <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={cn("h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-300", isExpanded && "rotate-180 bg-white/5 text-foreground")}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Actions Row (Visible only on small screens) */}
                <div className="md:hidden flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                     <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleBookmark}
                            disabled={isTogglingBookmark}
                            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                            {isTogglingBookmark ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : (
                                <Bookmark className={cn("h-3.5 w-3.5 mr-1.5", isBookmarked && "fill-primary text-primary")} />
                            )}
                            <span className="text-xs">{isBookmarked ? 'Saved' : 'Save'}</span>
                        </Button>
                     </div>
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <span className="text-xs mr-1.5">{isExpanded ? 'Less' : 'More'}</span>
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isExpanded && "rotate-180")} />
                    </Button>
                </div>
              </div>

              {/* Expandable Content Panel */}
              <div
                  className={cn(
                      "grid transition-[grid-template-rows] duration-500 ease-out",
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
              >
                  <div className="overflow-hidden">
                      <div className="px-4 md:px-5 pb-5 pt-0 flex flex-col gap-4">
                          {/* Divider */}
                          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                              {problemTags.slice(0, 6).map((tag) => (
                                  <TagBadge
                                      key={tag}
                                      tag={tag}
                                      className="bg-secondary/40 hover:bg-secondary/60 transition-colors border-white/5 text-secondary-foreground/80"
                                  />
                              ))}
                              {problemTags.length > 6 && (
                                  <Badge
                                      variant="outline"
                                      className="bg-transparent border-dashed border-white/20 text-muted-foreground text-[10px] px-2"
                                  >
                                      +{problemTags.length - 6}
                                  </Badge>
                              )}
                          </div>
                          
                           {/* Quick Actions Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                              <Button
                                  variant="default"
                                  className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-glow-sm border border-primary/20 backdrop-blur-sm"
                                  onClick={() => problem.link && window.open(problem.link, "_blank", "noopener,noreferrer")}
                              >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Write Code
                              </Button>

                              <Button
                                  variant="outline"
                                   className="w-full border-white/10 hover:bg-white/5 hover:border-white/20"
                                  onClick={() => {
                                      if (!user) promptLogin();
                                      else handleFindSimilar();
                                  }}
                                  disabled={isLoadingSimilar}
                              >
                                   {isLoadingSimilar ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2 text-purple-400" />}
                                  Similar
                              </Button>

                               <Button
                                  variant="outline"
                                  className="w-full border-white/10 hover:bg-white/5 hover:border-white/20"
                                  onClick={() => {
                                      if (!user) promptLogin();
                                      else handleGenerateInsights();
                                  }}
                                  disabled={isLoadingInsights}
                              >
                                  {isLoadingInsights ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />}
                                  Hints
                              </Button>

                              <Button
                                  variant="ghost"
                                  className="w-full hover:bg-white/5 text-muted-foreground opacity-50 cursor-not-allowed"
                                  onClick={(e) => {
                                      e.preventDefault();
                                      toast({ title: "Coming Soon", description: "Mock interview feature is in development." });
                                  }}
                              >
                                  <Bot className="h-4 w-4 mr-2" />
                                  Mock AI
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
