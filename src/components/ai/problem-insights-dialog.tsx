
'use client';

import type { GenerateProblemInsightsOutput } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Lightbulb, Brain, ListChecks, AlertTriangle, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Separator } from '@/components/ui/separator';

interface ProblemInsightsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  problemTitle: string;
  insights: GenerateProblemInsightsOutput | null;
  isLoading: boolean;
}

import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';

const ProblemInsightsDialog: React.FC<ProblemInsightsDialogProps> = ({
  isOpen,
  onClose,
  problemTitle,
  insights,
  isLoading,
}) => {
  const [contentHeightClass, setContentHeightClass] = useState("max-h-0");

  useEffect(() => {
    if (!isLoading && insights !== null) {
      const timer = setTimeout(() => {
        setContentHeightClass("max-h-[1000px]"); // Adjust value as needed
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setContentHeightClass("max-h-0");
    }
  }, [isLoading, insights]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Brain size={28} className="mr-3 text-primary" />
            AI Insights for "{problemTitle}"
          </DialogTitle>
          <DialogDescription>
            Key concepts, common approaches, and a hint to guide your thinking.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]"> {/* Added negative margin to offset scrollbar space */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating insights, please wait...</p>
            </div>
          ) : (
            <div className={cn(
              "transition-all duration-500 ease-in-out overflow-hidden",
              contentHeightClass
            )}>
              {insights ? (
                <div className="space-y-5 py-4 pr-1">
                  {insights.keyConcepts && insights.keyConcepts.length > 0 && (
                    <div>
                      <h3 className="text-md font-semibold mb-2 flex items-center text-primary">
                        <ListChecks size={18} className="mr-2" /> Key Concepts & Patterns
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-1">
                        {insights.keyConcepts.map((concept, index) => (
                          <li key={`concept-${index}`}>{concept}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.commonDataStructures && insights.commonDataStructures.length > 0 && (
                    <div>
                      <Separator className="my-3"/>
                      <h3 className="text-md font-semibold mb-2 flex items-center text-primary">
                        <Code size={18} className="mr-2" /> Common Data Structures
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-1">
                        {insights.commonDataStructures.map((ds, index) => (
                          <li key={`ds-${index}`}>{ds}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.commonAlgorithms && insights.commonAlgorithms.length > 0 && (
                    <div>
                      <Separator className="my-3"/>
                      <h3 className="text-md font-semibold mb-2 flex items-center text-primary">
                        <Brain size={18} className="mr-2" /> Common Algorithms & Techniques
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-1">
                        {insights.commonAlgorithms.map((algo, index) => (
                          <li key={`algo-${index}`}>{algo}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insights.highLevelHint && (
                    <div>
                      <Separator className="my-3"/>
                      <h3 className="text-md font-semibold mb-2 flex items-center text-primary">
                        <Lightbulb size={18} className="mr-2" /> High-Level Hint
                      </h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-3 rounded-md text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {insights.highLevelHint}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                    <AlertTriangle size={40} className="text-destructive" />
                    <p className="text-muted-foreground">
                    AI could not generate insights for this problem at the moment. Please try again later.
                    </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter className="mt-2">
          <DialogClose onClick={onClose}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProblemInsightsDialog;
