
'use client';

import type { GenerateCompanyStrategyOutput, FocusTopic, TargetRoleLevel, StrategyTodoItem, SavedStrategyTodoList } from '@/types';
import { targetRoleLevelOptions } from '@/types'; // Import options
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { generateCompanyStrategyAction, saveStrategyTodoListAction, getStrategyTodoListForCompanyAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb, Target, Loader2, ListChecks, Brain, UserCheck, Save, CheckSquare, RefreshCw, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/auth-context'; // For user session
import { cn } from '@/lib/utils';

interface CompanyStrategyGeneratorProps {
  companyId: string;
  companyName: string;
  companySlug: string;
}

const CompanyStrategyGenerator: React.FC<CompanyStrategyGeneratorProps> = ({ companyId, companyName, companySlug }) => {
  const [strategyData, setStrategyData] = useState<GenerateCompanyStrategyOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [hasSavedStrategy, setHasSavedStrategy] = useState(false);
  const [selectedRoleLevel, setSelectedRoleLevel] = useState<TargetRoleLevel>('general');
  const { toast } = useToast();
  const { user } = useAuth();

  const loadSavedStrategy = useCallback(async () => {
    if (!user) return;
    setIsLoadingSaved(true);
    setStrategyData(null); // Clear current strategy while loading saved one
    setHasSavedStrategy(false);

    const result = await getStrategyTodoListForCompanyAction(user.uid, companyId);
    setIsLoadingSaved(false);

    if (result && !('error' in result) && result !== null) {
      // Map SavedStrategyTodoList to GenerateCompanyStrategyOutput structure
      const loadedStrategy: GenerateCompanyStrategyOutput = {
        preparationStrategy: result.preparationStrategy,
        focusTopics: result.focusTopics,
        todoItems: result.items, // 'items' in SavedStrategyTodoList corresponds to 'todoItems'
      };
      setStrategyData(loadedStrategy);
      setHasSavedStrategy(true);
      toast({
        title: 'Saved Strategy Loaded',
        description: `Your previously saved strategy for ${companyName} has been loaded.`,
      });
    } else if (result && 'error' in result) {
      // Don't show error if simply not found, only if actual fetch error
      if(result.error !== 'Todo list not found.'){ // Assuming this is how a "not found" might be messaged by db layer
         toast({ title: 'Error Loading Saved Strategy', description: result.error, variant: 'destructive' });
      }
    }
    // If result is null (not found), do nothing, user will see generate button.
  }, [user, companyId, companyName, toast]);

  useEffect(() => {
    loadSavedStrategy();
  }, [loadSavedStrategy]);

  const handleGenerateStrategy = async () => {
    setIsLoading(true);
    if (!hasSavedStrategy) { // Only clear if no saved strategy was loaded before this generation
        setStrategyData(null);
    }
    
    toast({
      title: 'AI Strategy Generation In Progress 🧠💡',
      description: `Asking AI to develop a preparation strategy for ${companyName}${selectedRoleLevel !== 'general' ? ` (targeting ${selectedRoleLevel} role)` : ''}...`,
    });

    const result = await generateCompanyStrategyAction(companyId, selectedRoleLevel === 'general' ? undefined : selectedRoleLevel);
    setIsLoading(false);

    if ('error' in result || !result.preparationStrategy || !result.focusTopics || !result.todoItems) {
      toast({
        title: 'AI Strategy Generation Failed',
        description: ('error' in result && result.error) || 'Could not generate a strategy at this time.',
        variant: 'destructive',
      });
    } else {
      setStrategyData(result);
      setHasSavedStrategy(false); // A new strategy has been generated, it's no longer the "saved" one unless saved again
      toast({
        title: 'AI Preparation Strategy Generated! 🚀',
        description: `Successfully created a strategy for ${companyName}.`,
      });
    }
  };

  const handleSaveStrategy = async () => {
    if (!user || !strategyData) {
      toast({ title: "Cannot Save", description: "No user logged in or no strategy data to save.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    toast({ title: "Saving Strategy...", description: "Please wait."});

    // Pass the relevant parts of GenerateCompanyStrategyOutput
    const result = await saveStrategyTodoListAction(user.uid, companyId, companyName, {
        preparationStrategy: strategyData.preparationStrategy,
        focusTopics: strategyData.focusTopics,
        todoItems: strategyData.todoItems,
    });
    setIsSaving(false);

    if (result.success) {
      setHasSavedStrategy(true); // Mark that the current data is now considered "saved"
      toast({ title: "Strategy Saved!", description: `Your strategy for ${companyName} has been saved to your profile.`});
    } else {
      toast({ title: "Save Failed", description: result.error || "Could not save the strategy.", variant: "destructive"});
    }
  };

  const generateButtonText = hasSavedStrategy ? "Regenerate Strategy" : "Generate Prep Strategy";
  const generateButtonIcon = hasSavedStrategy ? <RefreshCw className="mr-2 h-5 w-5" /> : <Lightbulb className="mr-2 h-5 w-5" />;


  return (
    <div className="mt-12 py-8">
      <Separator className="my-8" />
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          <Brain className="inline-block mr-2 h-7 w-7 text-primary" />
          AI-Powered Interview Strategy
        </h2>
        <p className="mt-2 text-muted-foreground">
          {hasSavedStrategy 
            ? `Your saved preparation plan for ${companyName} is shown below. You can regenerate it or save changes.`
            : `Get a personalized preparation plan for ${companyName} based on its known problems.`
          }
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
                disabled={isLoading || isLoadingSaved}
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
        <Button onClick={handleGenerateStrategy} disabled={isLoading || isLoadingSaved} size="lg" className="w-full mt-2 sm:mt-0 sm:w-auto self-center sm:self-end">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              {generateButtonIcon}
              {generateButtonText}
            </>
          )}
        </Button>
      </div>

      {isLoadingSaved && (
        <div className="flex flex-col items-center justify-center p-10">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Loading saved strategy...</p>
        </div>
      )}

      {!isLoadingSaved && strategyData && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-xl">
                        {hasSavedStrategy ? "Your Saved Strategy for " : "AI-Generated Strategy for "} {companyName}
                    </CardTitle>
                    <CardDescription>
                        {hasSavedStrategy && `Last saved: ${new Date().toLocaleDateString()}. `}
                        Tailored for a {targetRoleLevelOptions.find(opt => opt.value === selectedRoleLevel)?.label.toLowerCase()} role.
                    </CardDescription>
                </div>
                {user && strategyData.todoItems && strategyData.todoItems.length > 0 && (
                     <Button onClick={handleSaveStrategy} disabled={isSaving || isLoading} size="sm">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {hasSavedStrategy ? "Update Saved Strategy" : "Save Strategy"}
                    </Button>
                )}
            </div>
             {hasSavedStrategy && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-xs flex items-center gap-2">
                    <Info size={14} /> This is your previously saved strategy. Regenerate if you want a fresh plan.
                </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <ListChecks size={20} className="mr-2 text-primary" />
                Overall Preparation Strategy
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
                <Accordion type="single" collapsible className="w-full space-y-2" defaultValue={strategyData.focusTopics.length > 0 ? "topic-0" : undefined}>
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

            {strategyData.todoItems && strategyData.todoItems.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold flex items-center">
                        <CheckSquare size={20} className="mr-2 text-primary" />
                        Actionable Todo List
                    </h3>
                    {/* Save button moved to header for better visibility with strategy data */}
                </div>
                <ul className="list-disc space-y-2 pl-5 bg-muted/30 p-4 rounded-md">
                  {strategyData.todoItems.map((item, index) => (
                    <li key={index} className={cn("prose prose-sm dark:prose-invert max-w-full", item.isCompleted && "line-through text-muted-foreground")}>
                       <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                         {item.text}
                       </ReactMarkdown>
                    </li>
                  ))}
                </ul>
                 {!user && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Log in to save this strategy to your profile.
                    </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {!isLoadingSaved && !strategyData && !isLoading && (
         <p className="text-center text-muted-foreground py-6">
          Click "Generate Prep Strategy" to get an AI-powered plan for {companyName}.
        </p>
      )}
    </div>
  );
};

export default CompanyStrategyGenerator;

    