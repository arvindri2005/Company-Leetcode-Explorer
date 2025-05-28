
'use client';

import type { SimilarProblemDetail } from '@/types';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'; // Using AlertDialog for simplicity
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import DifficultyBadge from '@/components/problem/difficulty-badge';
import TagBadge from '@/components/problem/tag-badge';
import Link from 'next/link';
import { ExternalLink, Lightbulb, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SimilarProblemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProblemTitle: string;
  similarProblems: SimilarProblemDetail[];
  isLoading: boolean; // To potentially show a loading state within the dialog
}

const SimilarProblemsDialog: React.FC<SimilarProblemsDialogProps> = ({
  isOpen,
  onClose,
  currentProblemTitle,
  similarProblems,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">
            AI Suggested Similar Problems for "{currentProblemTitle}"
          </AlertDialogTitle>
          <AlertDialogDescription>
            These problems are conceptually similar based on AI analysis.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <p className="text-center py-10 text-muted-foreground">Loading suggestions...</p>
          ) : similarProblems.length > 0 ? (
            <div className="space-y-4 py-4">
              {similarProblems.map((problem, index) => (
                <Card key={`${problem.title}-${index}`} className="shadow-md">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg">{problem.title}</CardTitle>
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </div>
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
                        View on LeetCode
                        <ExternalLink className="ml-2 h-4 w-4 group-hover:scale-105 transition-transform" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground">
              AI could not find any significantly similar problems in the current database.
            </p>
          )}
        </ScrollArea>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SimilarProblemsDialog;
