
'use client';

import type { LeetCodeProblem, AIProblemInput } from '@/types';
import type { GroupQuestionsOutput } from '@/ai/flows/group-questions';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { performQuestionGrouping } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProblemCard from '@/components/problem/problem-card';
import { Sparkles, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AIGroupingSectionProps {
  problems: LeetCodeProblem[];
  companyName: string;
}

const AIGroupingSection: React.FC<AIGroupingSectionProps> = ({ problems, companyName }) => {
  const [groupedData, setGroupedData] = useState<GroupQuestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGroupQuestions = async () => {
    setIsLoading(true);
    setGroupedData(null);
    toast({
      title: 'AI Grouping In Progress ✨',
      description: `Asking AI to group questions for ${companyName}...`,
    });

    const problemInputs: AIProblemInput[] = problems.map(p => ({
      title: p.title,
      difficulty: p.difficulty,
      link: p.link,
      tags: p.tags,
    }));

    const result = await performQuestionGrouping(problemInputs);

    setIsLoading(false);
    if ('error' in result) {
      toast({
        title: 'AI Grouping Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setGroupedData(result);
      toast({
        title: 'AI Grouping Complete!',
        description: `Questions grouped by themes for ${companyName}.`,
      });
    }
  };

  if (problems.length === 0) {
    return null; // Don't show AI section if no problems
  }

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

      <div className="flex justify-center mb-8">
        <Button onClick={handleGroupQuestions} disabled={isLoading} size="lg">
          {isLoading ? (
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
      </div>

      {groupedData && groupedData.groups && groupedData.groups.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Grouped Problem Insights</CardTitle>
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
                        // Find the original problem to reuse ProblemCard
                        // Note: AI output might slightly differ, so we match by title and link as best effort
                        const originalProblem = problems.find(p => p.title === problemData.title && p.link === problemData.link);
                        const displayProblem: LeetCodeProblem = originalProblem ? 
                          { ...originalProblem, ...problemData } : 
                          { id: `ai-${group.groupName}-${index}`, companyId: '', ...problemData };
                        
                        return <ProblemCard key={`${group.groupName}-${problemData.title}-${index}`} problem={displayProblem} />;
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIGroupingSection;
