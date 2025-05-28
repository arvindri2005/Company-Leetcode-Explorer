'use client';

import type { LeetCodeProblem, ProblemStatus, SimilarProblemDetail, GenerateProblemInsightsOutput } from '@/types';
import { lastAskedPeriodDisplayMap, PROBLEM_STATUS_OPTIONS, PROBLEM_STATUS_DISPLAY } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import DifficultyBadge from './difficulty-badge';
import TagBadge from './tag-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Tag, CalendarClock, Sparkles, Loader2, Bot, Star, CheckCircle2, Pencil, ListTodo, MoreVertical, Lightbulb, Clock, TrendingUp, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { performSimilarQuestionSearch, toggleBookmarkProblemAction, setProblemStatusAction, generateProblemInsightsAction } from '@/app/actions';
import SimilarProblemsDialog from '@/components/ai/similar-problems-dialog';
import ProblemInsightsDialog from '@/components/ai/problem-insights-dialog';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProblemCardProps {
  problem: LeetCodeProblem;
  initialIsBookmarked?: boolean;
  onBookmarkChanged?: (problemId: string, newStatus: boolean) => void;
  problemStatus?: ProblemStatus;
  onProblemStatusChange?: (problemId: string, newStatus: ProblemStatus) => void;
}

const ProblemStatusIcon: React.FC<{ status: ProblemStatus }> = ({ status }) => {
  if (status === 'none' || !PROBLEM_STATUS_DISPLAY[status]) return null;
  
  const statusConfig = {
    solved: { Icon: CheckCircle2, bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    attempted: { Icon: Pencil, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    todo: { Icon: ListTodo, bgColor: 'bg-blue-50', borderColor: 'border-blue-200' }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  const { Icon } = config;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center justify-center rounded-full p-1.5 transition-all duration-200",
            config.bgColor,
            config.borderColor,
            "border"
          )}>
            <Icon
              className={cn("h-4 w-4", PROBLEM_STATUS_DISPLAY[status]?.colorClass)}
              aria-label={`Status: ${PROBLEM_STATUS_DISPLAY[status]?.label}`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{PROBLEM_STATUS_DISPLAY[status]?.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  initialIsBookmarked = false,
  onBookmarkChanged,
  problemStatus = 'none',
  onProblemStatusChange,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [similarProblems, setSimilarProblems] = useState<SimilarProblemDetail[] | null>(null);
  const [isSimilarDialogSharedOpen, setIsSimilarDialogSharedOpen] = useState(false);

  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [problemInsights, setProblemInsights] = useState<GenerateProblemInsightsOutput | null>(null);
  const [isInsightsDialogOpen, setIsInsightsDialogOpen] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  const [currentStatus, setCurrentStatus] = useState<ProblemStatus>(problemStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => { setIsBookmarked(initialIsBookmarked); }, [initialIsBookmarked]);
  useEffect(() => { setCurrentStatus(problemStatus); }, [problemStatus]);

  const handleFindSimilar = async () => {
    setIsLoadingSimilar(true); 
    setSimilarProblems(null);
    toast({ 
      title: '🔍 Finding Similar Problems', 
      description: `AI is analyzing "${problem.title}" for similar patterns...` 
    });
    
    const result = await performSimilarQuestionSearch(problem);
    setIsLoadingSimilar(false);
    
    if (result && 'error' in result) {
      toast({ 
        title: 'Search Failed', 
        description: result.error, 
        variant: 'destructive' 
      });
    } else if (result && result.similarProblems) {
      setSimilarProblems(result.similarProblems); 
      setIsSimilarDialogSharedOpen(true);
      toast({ 
        title: '✨ Similar Problems Found!', 
        description: `Discovered ${result.similarProblems.length} related problem(s).` 
      });
    } else { 
      setSimilarProblems([]); 
      setIsSimilarDialogSharedOpen(true); 
      toast({ 
        title: 'No Matches Found', 
        description: 'This problem appears to be unique!' 
      }); 
    }
  };

  const handleGenerateInsights = async () => {
    setIsLoadingInsights(true); 
    setProblemInsights(null);
    toast({ 
      title: '🧠 Generating AI Insights', 
      description: `Analyzing key concepts and strategies for "${problem.title}"...`
    });
    
    const result = await generateProblemInsightsAction(problem);
    setIsLoadingInsights(false);
    
    if (result && 'error' in result) {
      toast({ 
        title: 'Insights Generation Failed', 
        description: result.error, 
        variant: 'destructive' 
      });
    } else if (result) {
      setProblemInsights(result);
      setIsInsightsDialogOpen(true);
      toast({ 
        title: '💡 Insights Ready!', 
        description: 'AI has analyzed the problem structure and hints.' 
      });
    } else {
      toast({ 
        title: 'Generation Error', 
        description: 'Could not generate insights for this problem.', 
        variant: 'destructive' 
      });
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) { 
      toast({ 
        title: 'Authentication Required', 
        description: 'Please sign in to bookmark problems.', 
        variant: 'destructive' 
      }); 
      return; 
    }
    
    if (isTogglingBookmark) return;
    setIsTogglingBookmark(true); 
    const oldStatus = isBookmarked;
    setIsBookmarked(!oldStatus); // Optimistic update
    
    try {
      const result = await toggleBookmarkProblemAction(user.uid, problem.id);
      if (result.success) {
        setIsBookmarked(result.isBookmarked ?? oldStatus);
        toast({ 
          title: result.isBookmarked ? '⭐ Bookmarked!' : '📖 Bookmark Removed', 
          description: `"${problem.title}" ${result.isBookmarked ? 'saved to' : 'removed from'} your collection.` 
        });
        onBookmarkChanged?.(problem.id, result.isBookmarked ?? oldStatus);
      } else { 
        setIsBookmarked(oldStatus); 
        toast({ 
          title: 'Bookmark Error', 
          description: result.error || 'Failed to update bookmark.', 
          variant: 'destructive' 
        }); 
      }
    } catch (error) { 
      setIsBookmarked(oldStatus); 
      toast({ 
        title: 'Connection Error', 
        description: 'Please check your connection and try again.', 
        variant: 'destructive' 
      }); 
    } finally { 
      setIsTogglingBookmark(false); 
    }
  };

  const handleStatusUpdate = async (newStatus: ProblemStatus) => {
    if (!user) { 
      toast({ 
        title: 'Authentication Required', 
        description: 'Please sign in to track your progress.', 
        variant: 'destructive' 
      }); 
      return; 
    }
    
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true); 
    const oldUiStatus = currentStatus;
    setCurrentStatus(newStatus); // Optimistic UI update
    
    try {
      const result = await setProblemStatusAction(user.uid, problem.id, newStatus);
      if (result.success) {
        const statusLabel = newStatus === 'none' ? 'cleared' : 
          `marked as ${PROBLEM_STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label}`;
        toast({ 
          title: '✅ Status Updated!', 
          description: `"${problem.title}" ${statusLabel}.` 
        });
        onProblemStatusChange?.(problem.id, newStatus);
      } else { 
        setCurrentStatus(oldUiStatus); 
        toast({ 
          title: 'Update Failed', 
          description: result.error || 'Failed to update status.', 
          variant: 'destructive' 
        }); 
      }
    } catch (error) { 
      setCurrentStatus(oldUiStatus); 
      toast({ 
        title: 'Connection Error', 
        description: 'Please check your connection and try again.', 
        variant: 'destructive' 
      }); 
    } finally { 
      setIsUpdatingStatus(false); 
    }
  };

  return (
    <>
      <Card className={cn(
        "group relative flex flex-col h-full transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
        "border-border/50 hover:border-primary/20",
        "bg-gradient-to-br from-card via-card to-muted/5"
      )}>
        {/* Status Indicator Stripe */}
        {currentStatus !== 'none' && (
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1 rounded-t-lg transition-all duration-300",
            currentStatus === 'solved' && "bg-green-500",
            currentStatus === 'attempted' && "bg-yellow-500", 
            currentStatus === 'todo' && "bg-blue-500"
          )} />
        )}

        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {user && <ProblemStatusIcon status={currentStatus} />}
              <div className="flex-1 min-w-0">
                <CardTitle className={cn(
                  "text-lg sm:text-xl leading-tight font-semibold",
                  "text-foreground group-hover:text-primary transition-colors duration-200",
                  "break-words hyphens-auto"
                )}>
                  {problem.title}
                </CardTitle>
                {problem.lastAskedPeriod && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs font-normal">
                      {lastAskedPeriodDisplayMap[problem.lastAskedPeriod]}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {user && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleToggleBookmark} 
                        disabled={isTogglingBookmark} 
                        className={cn(
                          "h-9 w-9 rounded-full transition-all duration-200",
                          "hover:bg-primary/10 hover:scale-110",
                          isBookmarked && "bg-primary/5"
                        )}
                        aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                      >
                        {isTogglingBookmark ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className={cn(
                            "h-4 w-4 transition-all duration-200",
                            isBookmarked 
                              ? "fill-yellow-400 text-yellow-400 scale-110" 
                              : "text-muted-foreground hover:text-yellow-400 hover:scale-110"
                          )} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isBookmarked ? "Remove Bookmark" : "Add Bookmark"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow space-y-4">
          {/* Tags Section */}
          {problem.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Topics ({problem.tags.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {problem.tags.slice(0, 6).map(tag => (
                  <TagBadge key={tag} tag={tag} />
                ))}
                {problem.tags.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{problem.tags.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Trending</span>
              </div>
              {problem.lastAskedPeriod && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Recent</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-2">
          {/* Action Buttons - Responsive Grid */}
          <div className="w-full space-y-3">
            {/* Primary Actions Row */}
            <div className="grid grid-cols-2 gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      asChild 
                      variant="default" 
                      size="sm" 
                      className="w-full font-medium"
                    >
                      <Link 
                        href={problem.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden sm:inline">Solve Problem</span>
                        <span className="sm:hidden">Solve</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Open in LeetCode</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      asChild 
                      variant="secondary" 
                      size="sm" 
                      className="w-full font-medium"
                    >
                      <Link 
                        href={`/mock-interview/${problem.id}`}
                        className="flex items-center justify-center gap-2"
                      >
                        <Bot className="h-4 w-4" />
                        <span className="hidden sm:inline">Mock Interview</span>
                        <span className="sm:hidden">Mock</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Practice with AI Interviewer</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Secondary Actions Row */}
            <div className={cn(
              "grid gap-2",
              user ? "grid-cols-3" : "grid-cols-2"
            )}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleFindSimilar} 
                      disabled={isLoadingSimilar}
                      className="w-full text-xs"
                    >
                      {isLoadingSimilar ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Similar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Find Similar Problems (AI)</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerateInsights} 
                      disabled={isLoadingInsights}
                      className="w-full text-xs"
                    >
                      {isLoadingInsights ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Lightbulb className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span className="ml-1.5 hidden sm:inline">Hints</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Get AI Insights & Hints</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {user && (
                <DropdownMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isUpdatingStatus}
                            className="w-full text-xs"
                          >
                            {isUpdatingStatus ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MoreVertical className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1.5 hidden sm:inline">Status</span>
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Update Progress Status</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Progress Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {PROBLEM_STATUS_OPTIONS.map(opt => (
                      <DropdownMenuItem 
                        key={opt.value} 
                        onSelect={() => handleStatusUpdate(opt.value)} 
                        disabled={currentStatus === opt.value || isUpdatingStatus}
                        className="flex items-center gap-2"
                      >
                        {opt.value === 'solved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {opt.value === 'attempted' && <Pencil className="h-4 w-4 text-yellow-600" />}
                        {opt.value === 'todo' && <ListTodo className="h-4 w-4 text-blue-600" />}
                        {opt.label}
                        {currentStatus === opt.value && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            Current
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Dialogs */}
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
    </>
  );
};

export default ProblemCard;