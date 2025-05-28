
'use client';

import type { GenerateCompanyStrategyOutput, FocusTopic, TargetRoleLevel } from '@/types';
import { targetRoleLevelOptions } from '@/types'; // Import options
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateCompanyStrategyAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb, Target, Loader2, ListChecks, Brain, UserCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CompanyStrategyGeneratorProps {
  companyId: string;
  companyName: string;
}

const CompanyStrategyGenerator: React.FC<CompanyStrategyGeneratorProps> = ({ companyId, companyName }) => {
  const [strategyData, setStrategyData] = useState<GenerateCompanyStrategyOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoleLevel, setSelectedRoleLevel] = useState<TargetRoleLevel>('general');
  const { toast } = useToast();

  const handleGenerateStrategy = async () => {
    setIsLoading(true);
    setStrategyData(null);
    toast({
      title: 'AI Strategy Generation In Progress 🧠💡',
      description: `Asking AI to develop a preparation strategy for ${companyName}${selectedRoleLevel !== 'general' ? ` (targeting ${selectedRoleLevel} role)` : ''}...`,
    });

    const result = await generateCompanyStrategyAction(companyId, selectedRoleLevel === 'general' ? undefined : selectedRoleLevel);
    setIsLoading(false);

    if ('error' in result || !result.preparationStrategy || !result.focusTopics) {
      toast({
        title: 'AI Strategy Generation Failed',
        description: ('error' in result && result.error) || 'Could not generate a strategy at this time.',
        variant: 'destructive',
      });
    } else {
      setStrategyData(result);
      toast({
        title: 'AI Preparation Strategy Generated! 🚀',
        description: `Successfully created a strategy for ${companyName}.`,
      });
    }
  };

  return (
    <div className="mt-12 py-8">
      <Separator className="my-8" />
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          <Brain className="inline-block mr-2 h-7 w-7 text-primary" />
          AI-Powered Interview Strategy
        </h2>
        <p className="mt-2 text-muted-foreground">
          Get a personalized preparation plan for {companyName} based on its known problems.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 mb-8 sm:flex-row">
        <div className="w-full sm:w-auto sm:max-w-xs">
            <Label htmlFor="role-level-select" className="mb-1.5 flex items-center text-sm font-medium text-muted-foreground justify-center sm:justify-start">
                <UserCheck size={16} className="mr-2" /> Target Role Level
            </Label>
            <Select
                value={selectedRoleLevel}
                onValueChange={(value) => setSelectedRoleLevel(value as TargetRoleLevel)}
                disabled={isLoading}
            >
                <SelectTrigger id="role-level-select" className="w-full">
                    <SelectValue placeholder="Select role level" />
                </SelectTrigger>
                <SelectContent>
                    {targetRoleLevelOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <Button onClick={handleGenerateStrategy} disabled={isLoading} size="lg" className="w-full mt-2 sm:mt-0 sm:w-auto self-center sm:self-end">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Strategy...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-5 w-5" />
              Generate Prep Strategy
            </>
          )}
        </Button>
      </div>

      {strategyData && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">AI-Generated Preparation Strategy for {companyName}</CardTitle>
            <CardDescription>Use this guidance to focus your study efforts effectively, tailored for a {targetRoleLevelOptions.find(opt => opt.value === selectedRoleLevel)?.label.toLowerCase()} role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <ListChecks size={20} className="mr-2 text-primary" />
                Overall Strategy
              </h3>
              <div className="prose prose-sm sm:prose dark:prose-invert max-w-none p-4 bg-muted/30 rounded-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {strategyData.preparationStrategy}
                </ReactMarkdown>
              </div>
            </div>

            {strategyData.focusTopics && strategyData.focusTopics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Target size={20} className="mr-2 text-primary" />
                  Key Focus Topics
                </h3>
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {strategyData.focusTopics.map((topicItem, index) => (
                    <AccordionItem value={`topic-${index}`} key={index} className="border bg-card rounded-md shadow-sm hover:shadow-md transition-shadow">
                      <AccordionTrigger className="p-4 text-left text-md font-medium hover:no-underline">
                        <div className="flex-1 prose prose-sm dark:prose-invert max-w-full break-words">
                           <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                                {topicItem.topic}
                           </ReactMarkdown>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-0">
                        <div className="prose prose-sm dark:prose-invert max-w-full break-words bg-muted/30 p-3 rounded-md">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {topicItem.reason}
                            </ReactMarkdown>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {strategyData && strategyData.focusTopics.length === 0 && !isLoading && (
         <p className="text-center text-muted-foreground">
          AI generated a strategy but did not identify specific focus topics beyond the main strategy.
        </p>
      )}
    </div>
  );
};

export default CompanyStrategyGenerator;
