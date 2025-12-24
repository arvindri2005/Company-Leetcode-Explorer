/**
 * @fileoverview A responsive dialog/drawer component for displaying AI-generated similar coding problems.
 *
 * This component adapts its presentation based on the viewport size, using a
 * standard dialog for desktop and a swipeable drawer for mobile. It is responsible
 * for showing a list of conceptually similar problems found by an AI service,
 * and it handles the loading and empty/error states for this data.
 */
"use client";

import type { SimilarProblemDetail } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DifficultyBadge from "@/components/problem/difficulty-badge";
import TagBadge from "@/components/problem/tag-badge";
import Link from "next/link";
import {
  ExternalLink,
  Lightbulb,
  Tag,
  Globe,
  Loader2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Props for the SimilarProblemsDialog component.
 */
interface SimilarProblemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentProblemTitle: string;
  similarProblems: SimilarProblemDetail[] | null;
  isLoading: boolean;
}

/**
 * Renders a single card displaying the details of a similar problem.
 * @param {{ problem: SimilarProblemDetail }} props - The props for the component.
 * @returns {JSX.Element} A card with information about a similar problem.
 */
const SimilarProblemCard = ({ problem }: { problem: SimilarProblemDetail }) => (
  <Card className="bg-muted/20 border-none shadow-sm">
    <CardHeader>
      <div className="flex justify-between items-start gap-2">
        <CardTitle className="text-lg">{problem.title}</CardTitle>
        {problem.difficulty && (
          <DifficultyBadge difficulty={problem.difficulty} />
        )}
      </div>
      <CardDescription className="flex items-center text-xs text-muted-foreground gap-1.5 pt-1">
        <Globe size={14} />
        Platform:{" "}
        <Badge variant="secondary" className="text-xs">
          {problem.platform}
        </Badge>
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {problem.tags && problem.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <Tag size={16} className="mr-2 text-primary" /> Tags
          </h4>
          <div className="flex flex-wrap gap-1">
            {problem.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        </div>
      )}
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center">
          <Lightbulb size={16} className="mr-2 text-primary" /> Similarity
          Reason
        </h4>
        <p className="text-sm text-foreground/80">{problem.similarityReason}</p>
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
);

/**
 * Renders the main content for the similar problems dialog, handling loading and empty states.
 * @param {{ similarProblems: SimilarProblemDetail[] | null; isLoading: boolean }} props - The props for the component.
 * @returns {JSX.Element} The content to be displayed inside the dialog/drawer.
 */
const SimilarProblemsContent = ({
  similarProblems,
  isLoading,
}: {
  similarProblems: SimilarProblemDetail[] | null;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          Finding similar problems...
        </p>
        <p className="text-sm text-muted-foreground/80">
          Please wait a moment.
        </p>
      </div>
    );
  }

  if (!similarProblems || similarProblems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
        <AlertTriangle size={48} className="text-destructive" />
        <h3 className="text-xl font-semibold">No Similar Problems Found</h3>
        <p className="text-muted-foreground max-w-sm">
          We couldn&apos;t find any significantly similar problems at this time. This
          might be a unique problem!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {similarProblems.map((problem, index) => (
        <SimilarProblemCard
          key={`${problem.platform}-${problem.title}-${index}`}
          problem={problem}
        />
      ))}
    </div>
  );
};

/**
 * Renders a responsive dialog or drawer to display AI-generated similar problems.
 *
 * This component adapts its layout based on the screen size, using a `Dialog` for
 * desktop views and a `Drawer` for mobile views. It serves as the main entry point for
 * displaying the similar problems UI, managing the open/close state and passing
 * data down to the `SimilarProblemsContent` component.
 *
 * @param {SimilarProblemsDialogProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Dialog or Drawer for displaying similar problems.
 */
const SimilarProblemsDialog: React.FC<SimilarProblemsDialogProps> = ({
  isOpen,
  onClose,
  currentProblemTitle,
  similarProblems,
  isLoading,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl w-[95vw] md:w-full max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-start">
              <Search
                size={28}
                className="mr-3 text-primary flex-shrink-0 mt-1"
              />
              <span>Similar Problems to &quot;{currentProblemTitle}&quot;</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              These problems are conceptually similar based on AI analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6">
            <SimilarProblemsContent
              similarProblems={similarProblems}
              isLoading={isLoading}
            />
          </div>
          <DialogFooter className="p-6 pt-4 flex-shrink-0">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl font-bold flex items-start">
            <Search
              size={24}
              className="mr-2 text-primary flex-shrink-0 mt-1"
            />
            Similar Problems to &quot;{currentProblemTitle}&quot;
          </DrawerTitle>
          <DrawerDescription>
            These problems are conceptually similar based on AI analysis.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-6 max-h-[60vh]" data-vaul-no-drag>
          <SimilarProblemsContent
            similarProblems={similarProblems}
            isLoading={isLoading}
          />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SimilarProblemsDialog;
