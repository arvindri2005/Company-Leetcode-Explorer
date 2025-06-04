
'use client';

import type { LeetCodeProblem, AIProblemInput } from '@/types';
import type { GroupQuestionsOutput } from '@/ai/flows/group-questions';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { performQuestionGrouping } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ProblemCard from '@/components/problem/problem-card';
import { Sparkles, Loader2, LogIn, Info, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { useAICooldown } from '@/hooks/use-ai-cooldown'; // Import cooldown hook
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AIGroupingSectionProps {
  problems: LeetCodeProblem[];
  companyName: string;
  companySlug: string;
}

const AIGroupingSection: React.FC<AIGroupingSectionProps> = ({ problems, companyName, companySlug }) => {
  const { user, loading: authLoading } = useAuth();
  const { canUseAI, startCooldown, formattedRemainingTime, isLoadingCooldown } = useAICooldown(); // Cooldown hook
  const pathname = usePathname();
  const [groupedData, setGroupedData] = useState<GroupQuestionsOutput | null>(null);
  const [isAILoading, setIsAILoading] = useState(false); // Renamed isLoading to isAILoading
  const { toast } = useToast();

  const handleGroupQuestions = async () => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please log in to use AI features.', variant: 'destructive' });
      return;
    }
    if (isLoadingCooldown || !canUseAI) {
      toast({ title: "AI Feature on Cooldown", description: `Please wait ${formattedRemainingTime} before using another AI feature.`, variant: "default" });
      return;
    }

    setIsAILoading(true);
    setGroupedData(null);
    toast({
      title: 'AI Grouping In Progress ✨',
      description: `Asking AI to group questions for ${companyName}...`,
    });

    const problemInputs: AIProblemInput[] = problems.map(p => ({
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      link: p.link,
      tags: p.tags,
    }));

    const result = await performQuestionGrouping(problemInputs);

    setIsAILoading(false);
    if ('error' in result) {
      toast({
        title: 'AI Grouping Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setGroupedData(result);
      startCooldown(); // Start cooldown on successful AI operation
      toast({
        title: 'AI Grouping Complete!',
        description: `Questions grouped by themes for ${companyName}.`,
      });
    }
  };

  if (problems.length === 0) {
    return null;
  }
  
  const isButtonDisabled = authLoading || isLoadingCooldown || (!isLoadingCooldown && !canUseAI) || isAILoading;

  const renderContent = () => {
    if (authLoading) {
      return (
        <div className="flex justify-center my-8">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading AI Feature...
        </div>
      );
    }

    if (!user) {
      return (
        <Card className="mt-6 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2"><Info size={22}/> Login to Use AI Grouping</CardTitle>
            <CardDescription>This feature requires you to be logged in.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/login?redirectUrl=${encodeURIComponent(pathname)}`}>
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="flex flex-col items-center justify-center mb-8">
          <Button onClick={handleGroupQuestions} disabled={isButtonDisabled} size="lg">
            {isAILoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Grouping...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Group Questions with AI
              </>
            )}
          </Button>
          {(!isLoadingCooldown && !canUseAI && user) && (
             <p className="mt-2 text-xs text-destructive flex items-center">
                <AlertCircle size={14} className="mr-1" />
                AI on cooldown. Available in: {formattedRemainingTime}
             </p>
          )}
        </div>

        {groupedData && groupedData.groups && groupedData.groups.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Grouped Problem Insights for {companyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {groupedData.groups.map((group) => (
                  <AccordionItem value={group.groupName} key={group.groupName}>
                    <AccordionTrigger className="text-lg hover:no-underline">
                      {group.groupName} ({group.questions.length} problems)
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 bg-muted/30 rounded-md">
                        {group.questions.map((problemData, index) => {
                          const originalProblem = problems.find(p => p.slug === problemData.slug && p.title === problemData.title);
                          const displayProblem: LeetCodeProblem = originalProblem ?
                            { ...originalProblem, ...problemData, companySlug: originalProblem.companySlug || companySlug } :
                            {
                              id: `ai-${group.groupName}-${index}`,
                              companyId: '',
                              companySlug: companySlug,
                              ...problemData
                            };

                          return <ProblemCard
                                    key={`${group.groupName}-${problemData.slug}-${index}`}
                                    problem={displayProblem}
                                    companySlug={displayProblem.companySlug}
                                 />;
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </>
    );
  };


  return (
    <div className="mt-12 py-8">
      <Separator className="my-8" />
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          <Sparkles className="inline-block mr-2 h-7 w-7 text-primary" />
          AI-Powered Question Grouping
        </h2>
        <p className="mt-2 text-muted-foreground">
          Discover related themes and concepts among these problems.
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

export default AIGroupingSection;
