/**
 * @fileoverview Bookmarks tab component for profile page
 */
"use client";

import { Bookmark } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorBoundary from "@/components/ui/error-boundary";
import { TabsContent } from "@/components/ui/tabs";
import ProfileProblemList from "@/features/profile/components/profile-problem-list";
import ProfileTabErrorFallback from "@/features/profile/components/profile-tab-error-fallback";
import type { LeetCodeProblem, ProblemStatus } from "@/types";

interface ProblemWithDetails extends LeetCodeProblem {
  currentStatus?: ProblemStatus;
  isBookmarked?: boolean;
}

export interface BookmarksTabProps {
  problems: ProblemWithDetails[];
  isLoading: boolean;
  onBookmarkChanged: (problemId: string, newStatus: boolean) => void;
  onProblemStatusChange: (problemId: string, newStatus: ProblemStatus) => void;
}

const BOOKMARK_ICON = <Bookmark className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;

/**
 * BookmarksTab component displays user's bookmarked problems
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function BookmarksTab({
  problems,
  isLoading,
  onBookmarkChanged,
  onProblemStatusChange,
}: BookmarksTabProps) {
  return (
    <TabsContent value="bookmarks">
      <ErrorBoundary
        fallbackRender={(props) => (
          <ProfileTabErrorFallback
            {...props}
            tabName="Bookmarked Problems"
          />
        )}
      >
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Your Bookmarked Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileProblemList
              title="Bookmarked Problems"
              problems={problems}
              isLoading={isLoading}
              listType="bookmarks"
              onBookmarkChanged={onBookmarkChanged}
              onProblemStatusChange={onProblemStatusChange}
              emptyStateMessage="No bookmarks yet"
              emptyStateDescription="Save interesting problems to your bookmarks to easily find them later."
              emptyStateIcon={BOOKMARK_ICON}
            />
          </CardContent>
        </Card>
      </ErrorBoundary>
    </TabsContent>
  );
}
