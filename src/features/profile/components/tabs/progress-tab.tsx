/**
 * @fileoverview Progress tabs component for solved, attempted, and todo problems
 */
"use client";

import { CheckCircle2, ListTodo,Pencil } from "lucide-react";

import ProfileProblemList from "@/features/profile/components/profile-problem-list";
import ProfileTabErrorFallback from "@/features/profile/components/profile-tab-error-fallback";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import ErrorBoundary from "@/shared/components/ui/error-boundary";
import { TabsContent } from "@/shared/components/ui/tabs";
import type { LeetCodeProblem, ProblemStatus } from "@/shared/types";

interface ProblemWithDetails extends LeetCodeProblem {
  currentStatus?: ProblemStatus;
  isBookmarked?: boolean;
}

export interface ProgressTabProps {
  tabValue: "solved" | "attempted" | "todo";
  problems: ProblemWithDetails[];
  isLoading: boolean;
  onBookmarkChanged: (problemId: string, newStatus: boolean) => void;
  onProblemStatusChange: (
    problemId: string,
    newStatus: ProblemStatus,
    companySlug?: string,
    problemSlug?: string,
  ) => void;
}

const SOLVED_ICON = <CheckCircle2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;
const ATTEMPTED_ICON = <Pencil className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;
const TODO_ICON = <ListTodo className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;

const TAB_CONFIG = {
  solved: {
    title: "Solved Problems",
    emptyMessage: "No solved problems",
    emptyDescription: "You haven't solved any problems yet. Start your journey today!",
    icon: SOLVED_ICON,
  },
  attempted: {
    title: "Attempted Problems",
    emptyMessage: "No attempted problems",
    emptyDescription: "Problems you've started but haven't finished will appear here.",
    icon: ATTEMPTED_ICON,
  },
  todo: {
    title: "To-Do Problems",
    emptyMessage: "Your to-do list is empty",
    emptyDescription: "Plan your practice by adding problems to your to-do list.",
    icon: TODO_ICON,
  },
};

/**
 * ProgressTab component displays problems by status (solved, attempted, todo)
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function ProgressTab({
  tabValue,
  problems,
  isLoading,
  onBookmarkChanged,
  onProblemStatusChange,
}: ProgressTabProps) {
  const config = TAB_CONFIG[tabValue];

  return (
    <TabsContent value={tabValue}>
      <ErrorBoundary
        fallbackRender={(props) => (
          <ProfileTabErrorFallback {...props} tabName={config.title} />
        )}
      >
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileProblemList
              title={config.title}
              problems={problems}
              isLoading={isLoading}
              listType="status"
              onBookmarkChanged={onBookmarkChanged}
              onProblemStatusChange={onProblemStatusChange}
              emptyStateMessage={config.emptyMessage}
              emptyStateDescription={config.emptyDescription}
              emptyStateIcon={config.icon}
            />
          </CardContent>
        </Card>
      </ErrorBoundary>
    </TabsContent>
  );
}
