/**
 * @fileoverview Defines a highly interactive card component for displaying a single coding problem.
 *
 * This client-side component renders all details for a coding problem and includes
 * numerous interactive elements for user engagement. This includes bookmarking,
 * setting problem status, and triggering various AI-powered features like finding
 * similar problems and generating hints.
 */
'use client';

import type { LeetCodeProblem, ProblemStatus, SimilarProblemDetail, GenerateProblemInsightsOutput } from '@/types';
import { lastAskedPeriodDisplayMap, PROBLEM_STATUS_OPTIONS, PROBLEM_STATUS_DISPLAY } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import DifficultyBadge from './difficulty-badge';
import TagBadge from './tag-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Tag, Sparkles, Loader2, Bot, Star, CheckCircle2, Pencil, ListTodo, MoreVertical, Lightbulb, Clock, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { performSimilarQuestionSearch, toggleBookmarkProblemAction, setProblemStatusAction, generateProblemInsightsAction } from '@/app/actions';
import { useAuth } from '@/contexts/auth-context';
import { useAICooldown } from '@/hooks/use-ai-cooldown';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter, usePathname } from 'next/navigation';
import type { User as FirebaseUser } from 'firebase/auth';

// Dynamically import dialogs to avoid including them in the initial bundle.
const SimilarProblemsDialog = dynamic(() => import('@/components/ai/similar-problems-dialog'), {
  loading: () => <p>Loading dialog...</p>,
});
const ProblemInsightsDialog = dynamic(() => import('@/components/ai/problem-insights-dialog'), {
  loading: () => <p>Loading dialog...</p>,
});

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
 * @param {{ status: ProblemStatus }} props - The props for the component.
 * @returns {JSX.Element | null} The rendered status icon with a tooltip, or null.
 */
const ProblemStatusIconComponent: React.FC<{ status: ProblemStatus }> = ({ status }) => {
  if (status === 'none' || !PROBLEM_STATUS_DISPLAY[status]) return null;

  const statusConfig = {
    solved: { Icon: CheckCircle2, bgColor: 'bg-green-100', textColor: 'text-green-800' },
    attempted: { Icon: Pencil, bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    todo: { Icon: ListTodo, bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  const { Icon, bgColor, textColor } = config;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", bgColor)}>
            <Icon
              className={cn("h-5 w-5", textColor)}
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
const ProblemStatusIcon = React.memo(ProblemStatusIconComponent);


/**
 * Renders the dynamic content for an AI feature's tooltip.
 * It shows the default text, a login prompt, or the remaining cooldown time.
 * @param {{ defaultText: string; user: FirebaseUser | null }} props - The props for the component.
 * @returns {JSX.Element} The content for the tooltip.
 */
const AITooltipContentComponent: React.FC<{ defaultText: string; user: FirebaseUser | null }> = ({ defaultText, user }) => {
  const { canUseAI, isLoadingCooldown, formattedRemainingTime } = useAICooldown();
  const isAIButtonCurrentlyDisabled = isLoadingCooldown || !canUseAI;

  let content = defaultText;
  if (!user) {
    content = "Login to use AI features";
  } else if (isAIButtonCurrentlyDisabled && !isLoadingCooldown) {
    content = `AI on cooldown: ${formattedRemainingTime}`;
  }
  return <p>{content}</p>;
};
const AITooltipContent = React.memo(AITooltipContentComponent);

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
  problemStatus = 'none',
  onProblemStatusChange,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canUseAI, startCooldown, formattedRemainingTime, isLoadingCooldown } = useAICooldown();
  const router = useRouter();
  const pathname = usePathname();

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

  const redirectToLogin = useCallback(() => {
    router.push(`/login?redirectUrl=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);
  
  const isUserActionDisabled = !user; 
  const isAIActionDisabled = isUserActionDisabled || isLoadingCooldown || !canUseAI;
  const cooldownToastMessage = `AI features are on cooldown. Please wait ${formattedRemainingTime} before using another AI feature.`;

  const handleFindSimilar = async () => {
    if (!user) { redirectToLogin(); return; }
    if (isLoadingCooldown || !canUseAI) {
      toast({ title: "AI Feature on Cooldown", description: cooldownToastMessage, variant: "default" });
      return;
    }
    setIsLoadingSimilar(true);
    setSimilarProblems(null);
    setIsSimilarDialogSharedOpen(true);

    const result = await performSimilarQuestionSearch(problem.slug, problem.companySlug || companySlug);
    setIsLoadingSimilar(false);

    if (result && 'error' in result) {
      toast({ title: 'Search Failed', description: result.error, variant: 'destructive' });
    } else if (result && result.similarProblems) {
      setSimilarProblems(result.similarProblems);
      startCooldown(); 
      toast({ title: '✨ Similar Problems Found!', description: `Discovered ${result.similarProblems.length} related problem(s).` });
    } else {
      setSimilarProblems([]);
      startCooldown();
      toast({ title: 'No Matches Found', description: 'This problem appears to be unique!' });
    }
  };

  const handleGenerateInsights = async () => {
    if (!user) { redirectToLogin(); return; }
    if (isLoadingCooldown || !canUseAI) {
      toast({ title: "AI Feature on Cooldown", description: cooldownToastMessage, variant: "default" });
      return;
    }
    setIsLoadingInsights(true);
    setProblemInsights(null);
    setIsInsightsDialogOpen(true);

    const result = await generateProblemInsightsAction(problem);
    setIsLoadingInsights(false);

    if (result && 'error' in result) {
      toast({ title: 'Insights Generation Failed', description: result.error, variant: 'destructive' });
    } else if (result) {
      setProblemInsights(result);
      startCooldown(); 
      toast({ title: '💡 Insights Ready!', description: 'AI has analyzed the problem structure and hints.' });
    } else {
      toast({ title: 'Generation Error', description: 'Could not generate insights for this problem.', variant: 'destructive' });
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) { redirectToLogin(); return; }
    if (isTogglingBookmark) return;
    setIsTogglingBookmark(true);
    const oldStatus = isBookmarked;
    setIsBookmarked(!oldStatus); 

    try {
      const effectiveCompanySlug = problem.companySlug || companySlug;
      const result = await toggleBookmarkProblemAction(user.uid, problem.id, effectiveCompanySlug, problem.slug);
      if (result.success) {
        setIsBookmarked(result.isBookmarked ?? oldStatus); 
        toast({ title: result.isBookmarked ? '⭐ Bookmarked!' : '📖 Bookmark Removed', description: `"${problem.title}" ${result.isBookmarked ? 'saved to' : 'removed from'} your collection.` });
        onBookmarkChanged?.(problem.id, result.isBookmarked ?? oldStatus);
      } else {
        setIsBookmarked(oldStatus); 
        toast({ title: 'Bookmark Error', description: result.error || 'Failed to update bookmark.', variant: 'destructive' });
      }
    } catch (error) {
      setIsBookmarked(oldStatus); 
      toast({ title: 'Connection Error', description: 'Please check your connection and try again.', variant: 'destructive' });
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  const handleStatusUpdate = async (newStatus: ProblemStatus) => {
    if (!user) { redirectToLogin(); return; }
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    const oldUiStatus = currentStatus;
    setCurrentStatus(newStatus); 

    try {
      const effectiveCompanySlug = problem.companySlug || companySlug;
      const result = await setProblemStatusAction(user.uid, problem.id, newStatus, effectiveCompanySlug, problem.slug);
      if (result.success) {
        const statusLabel = newStatus === 'none' ? 'cleared' : `marked as ${PROBLEM_STATUS_OPTIONS.find(opt => opt.value === newStatus)?.label}`;
        toast({ title: '✅ Status Updated!', description: `"${problem.title}" ${statusLabel}.` });
        onProblemStatusChange?.(problem.id, newStatus);
      } else {
        setCurrentStatus(oldUiStatus); 
        toast({ title: 'Update Failed', description: result.error || 'Failed to update status.', variant: 'destructive' });
      }
    } catch (error) {
      setCurrentStatus(oldUiStatus); 
      toast({ title: 'Connection Error', description: 'Please check your connection and try again.', variant: 'destructive' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const problemTags = problem.tags || [];

  return (
    <>
      <Card className={cn(
        "flex flex-col h-full",
        "bg-card border border-border/50 rounded-2xl shadow-sm",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-md hover:border-primary/30"
      )}>
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
                    <span>{lastAskedPeriodDisplayMap[problem.lastAskedPeriod]}</span>
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
                        aria-label={isBookmarked ? `Remove bookmark for ${problem.title}` : `Add bookmark for ${problem.title}`}
                      >
                        {isTogglingBookmark ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className={cn(
                            "h-5 w-5 transition-all duration-200",
                            isBookmarked
                              ? "fill-yellow-400 text-yellow-500"
                              : "text-muted-foreground hover:text-yellow-400"
                          )} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isBookmarked ? "Remove Bookmark" : (isUserActionDisabled ? "Login to bookmark" : "Add Bookmark")}</p>
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
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Topics</h4>
              <div className="flex flex-wrap gap-2">
                {problemTags.slice(0, 4).map(tag => (
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
                  window.open(problem.link, '_blank', 'noopener,noreferrer');
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
                  toast({ title: 'Coming Soon', description: 'Mock interview feature is in development.', variant: 'default' });
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
            {isLoadingSimilar ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
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
            {isLoadingInsights ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lightbulb className="h-4 w-4 mr-2" />}
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
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Progress Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {PROBLEM_STATUS_OPTIONS.map(opt => (
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

