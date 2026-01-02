/**
 * @fileoverview A responsive dialog/drawer component for displaying AI-generated insights about a coding problem.
 *
 * This component uses a standard dialog for desktop views and a swipeable drawer
 * for mobile views to present information like key concepts, common data structures,
 * algorithms, and a high-level hint for a specific problem. It handles loading
 * and error states for the insights data.
 */
"use client";

import React from "react";
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
  Loader2,
  Lightbulb,
  Brain,
  ListChecks,
  AlertTriangle,
  Code,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenerateProblemInsightsOutput } from "@/types";
import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Props for the ProblemInsightsDialog component.
 */
interface ProblemInsightsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  problemTitle: string;
  insights: GenerateProblemInsightsOutput | null;
  isLoading: boolean;
}

/**
 * A reusable component for displaying a single section of insights.
 * @param {{ title: string; icon: React.ReactNode; children: React.ReactNode }} props - The props for the component.
 * @returns {JSX.Element} A card containing a titled section of content.
 */
const InsightSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card className="bg-muted/20 border-none shadow-sm">
    <CardHeader className="flex flex-row items-center space-x-3 pb-3">
      {icon}
      <CardTitle className="text-lg text-primary">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-sm">{children}</CardContent>
  </Card>
);

/**
 * Renders the main content of the insights dialog, handling loading and empty states.
 * @param {{ insights: GenerateProblemInsightsOutput | null; isLoading: boolean }} props - The props for the component.
 * @returns {JSX.Element} The content to be displayed inside the dialog/drawer.
 */
const InsightsContent = ({
  insights,
  isLoading,
}: {
  insights: GenerateProblemInsightsOutput | null;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Generating insights...</p>
        <p className="text-sm text-muted-foreground/80">
          Please wait a moment.
        </p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
        <AlertTriangle size={48} className="text-destructive" />
        <h3 className="text-xl font-semibold">Insights Not Available</h3>
        <p className="text-muted-foreground max-w-sm">
          We couldn't generate insights for this problem at the moment. This
          could be a temporary issue. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      {insights.keyConcepts && insights.keyConcepts.length > 0 && (
        <InsightSection
          title="Key Concepts & Patterns"
          icon={<ListChecks size={22} />}
        >
          <ul className="list-disc list-inside space-y-1.5">
            {insights.keyConcepts.map((concept, index) => (
              <li key={`concept-${index}`}>{concept}</li>
            ))}
          </ul>
        </InsightSection>
      )}
      {insights.commonDataStructures &&
        insights.commonDataStructures.length > 0 && (
          <InsightSection
            title="Common Data Structures"
            icon={<Code size={22} />}
          >
            <ul className="list-disc list-inside space-y-1.5">
              {insights.commonDataStructures.map((ds, index) => (
                <li key={`ds-${index}`}>{ds}</li>
              ))}
            </ul>
          </InsightSection>
        )}
      {insights.commonAlgorithms && insights.commonAlgorithms.length > 0 && (
        <InsightSection
          title="Common Algorithms & Techniques"
          icon={<Brain size={22} />}
        >
          <ul className="list-disc list-inside space-y-1.5">
            {insights.commonAlgorithms.map((algo, index) => (
              <li key={`algo-${index}`}>{algo}</li>
            ))}
          </ul>
        </InsightSection>
      )}
      {insights.highLevelHint && (
        <InsightSection title="High-Level Hint" icon={<Lightbulb size={22} />}>
          <div className="prose prose-sm dark:prose-invert bg-background/50 p-3 rounded-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {insights.highLevelHint}
            </ReactMarkdown>
          </div>
        </InsightSection>
      )}
    </div>
  );
};

/**
 * Renders a responsive dialog or drawer to display AI-generated problem insights.
 *
 * This component dynamically switches between a `Dialog` on desktop screens
 * (>= 768px) and a `Drawer` on mobile screens. It serves as the main entry point
 * for displaying the insights UI, managing the open/close state and passing the
 * relevant data down to the `InsightsContent` component.
 *
 * @param {ProblemInsightsDialogProps} props - The props for the component.
 * @returns {JSX.Element} The rendered Dialog or Drawer component.
 */
export default function ProblemInsightsDialog({
  isOpen,
  onClose,
  problemTitle,
  insights,
  isLoading,
}: ProblemInsightsDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border border-border rounded-xl mb-8 shadow-sm max-w-3xl w-[95vw] md:w-full max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-start">
              <Brain
                size={28}
                className="mr-3 text-primary flex-shrink-0 mt-1"
              />
              <span>AI Insights for "{problemTitle}"</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Key concepts, common approaches, and a hint to guide your
              thinking.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6">
            <InsightsContent insights={insights} isLoading={isLoading} />
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
      <DrawerContent className="bg-card border border-border rounded-xl shadow-sm">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl font-bold flex items-start">
            <Brain size={24} className="mr-2 text-primary flex-shrink-0 mt-1" />
            AI Insights for "{problemTitle}"
          </DrawerTitle>
          <DrawerDescription>
            Key concepts, common approaches, and a hint to guide your thinking.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-6 max-h-[60vh]" data-vaul-no-drag>
          <InsightsContent insights={insights} isLoading={isLoading} />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
