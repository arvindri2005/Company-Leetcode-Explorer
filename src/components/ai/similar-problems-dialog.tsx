
'use client';

import type { SimilarProblemDetail } from '@/types';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import DifficultyBadge from '@/components/problem/difficulty-badge';
import TagBadge from '@/components/problem/tag-badge';
import Link from 'next/link';
import { ExternalLink, Lightbulb, Tag, Globe, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface SimilarProblemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProblemTitle: string;
  similarProblems: SimilarProblemDetail[];
  isLoading: boolean;
}

import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';

const SimilarProblemsDialog: React.FC<SimilarProblemsDialogProps> = ({
  isOpen,
  onClose,
  currentProblemTitle,
  similarProblems,
  isLoading,
}) => {
  const [contentHeightClass, setContentHeightClass] = useState("max-h-0");

  useEffect(() => {
    if (!isLoading && similarProblems !== null) {
      const timer = setTimeout(() => {
        setContentHeightClass("max-h-[1000px]"); // Adjust value as needed
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setContentHeightClass("max-h-0");
    }
  }, [isLoading, similarProblems]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] border border-border rounded-3xl mb-8 shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            AI Suggested Similar Problems for "{currentProblemTitle}"
          </DialogTitle>
          <DialogDescription>
            These problems from various platforms are conceptually similar based on AI analysis.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Searching for similar problems...</p>
            </div>
          ) : (
            <div className={cn(
              "transition-all duration-500 ease-in-out overflow-hidden",
              contentHeightClass
            )}>
              {similarProblems.length > 0 ? (
                <div className="space-y-4 py-4">
                  {similarProblems.map((problem, index) => (
                    <Card key={`${problem.platform}-${problem.title}-${index}`} className="border border-border rounded-3xl mb-8 shadow-sm">
                      <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-lg">{problem.title}</CardTitle>
                          {problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} />}
                        </div>
                        <CardDescription className="flex items-center text-xs text-muted-foreground gap-1.5 pt-1">
                            <Globe size={14} />
                            Platform: <Badge variant="secondary" className="text-xs">{problem.platform}</Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {problem.tags && problem.tags.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center">
                              <Tag size={14} className="mr-1" /> Tags
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {problem.tags.map(tag => (
                                <TagBadge key={tag} tag={tag} />
                              ))}
                            </div>
                          </div>
                        )}
                         <div className="mt-2 pt-2 border-t">
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center">
                                <Lightbulb size={14} className="mr-1 text-primary" /> Similarity Reason
                            </h4>
                            <p className="text-sm text-foreground">{problem.similarityReason}</p>
                         </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild variant="outline" size="sm" className="w-full group">
                          <Link href={problem.link} target="_blank" rel="noopener noreferrer">
                            View on {problem.platform}
                            <ExternalLink className="ml-2 h-4 w-4 group-hover:scale-105 transition-transform" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">
                  AI could not find any significantly similar problems from other platforms at this time.
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button onClick={onClose} variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimilarProblemsDialog;
