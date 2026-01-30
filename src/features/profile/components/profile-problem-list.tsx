"use client";

import React, { memo } from "react";

import Link from "next/link";

import { ClipboardList } from "lucide-react";

import { ProblemCard } from "@/features/problems";
import { ProblemCardSkeleton } from "@/shared/components/skeletons/problem-skeletons";
import { Button } from "@/shared/components/ui/button";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import type { LeetCodeProblem, ProblemStatus } from "@/shared/types";

/**
 * @interface ProblemWithStatusAndBookmark
 * @description Extends the LeetCodeProblem type to include optional status and bookmark information.
 * @property {ProblemStatus} [currentStatus] - The user's current status for the problem.
 * @property {boolean} [isBookmarked] - Whether the user has bookmarked the problem.
 */
interface ProblemWithStatusAndBookmark extends LeetCodeProblem {
  currentStatus?: ProblemStatus;
  isBookmarked?: boolean;
}

/**
 * @interface ProfileProblemListProps
 * @description Props for the ProfileProblemList component.
 * @property {string} title - The title to be displayed for the list.
 * @property {ProblemWithStatusAndBookmark[]} problems - An array of problems to display.
 * @property {boolean} isLoading - A flag to indicate if the problem list is currently loading.
 * @property {'bookmarks' | 'status'} listType - The type of list, used for potential differentiation in handling.
 * @property {(problemId: string, newStatus: boolean) => void} [onBookmarkChanged] - Optional callback function for when a problem's bookmark status changes.
 * @property {(problemId: string, newStatus: ProblemStatus) => void} [onProblemStatusChange] - Optional callback function for when a problem's status changes.
 * @property {string} [companySlugForProblemCard] - Optional company slug to be used as a fallback for all problem cards in the list.
 */
interface ProfileProblemListProps {
  title: string;
  problems: ProblemWithStatusAndBookmark[];
  isLoading: boolean;
  listType: "bookmarks" | "status"; // To differentiate handling slightly if needed
  onBookmarkChanged?: (problemId: string, newStatus: boolean) => void;
  onProblemStatusChange?: (
    problemId: string,
    newStatus: ProblemStatus,
    companySlug?: string,
    problemSlug?: string,
  ) => void;
  companySlugForProblemCard?: string; // If all problems belong to one company, for fallback
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: React.ReactNode;
}

/**
 * @function ProfileProblemList
 * @description A component that displays a grid of LeetCode problems from a user's profile, such as bookmarked problems or problems with a specific status.
 * @param {ProfileProblemListProps} props - The props for the component.
 * @returns {JSX.Element} The rendered list of problem cards, a loading skeleton, or a message if the list is empty.
 */
const ProfileProblemList: React.FC<ProfileProblemListProps> = ({
  problems,
  isLoading,
  onBookmarkChanged,
  onProblemStatusChange,
  companySlugForProblemCard,
  emptyStateMessage,
  emptyStateDescription,
  emptyStateIcon,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-2">
        {[...Array(6)].map((_, i) => (
          <ProblemCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted rounded-xl bg-muted/5">
        <div className="bg-background p-3 rounded-full mb-4 ring-1 ring-border shadow-sm">
          {emptyStateIcon || (
            <ClipboardList
              className="h-6 w-6 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          {emptyStateMessage || "No problems found"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {emptyStateDescription ||
            "This list is currently empty. Start solving or bookmarking problems to see them here!"}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/problems">Browse Problems</Link>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid gap-2">
        {problems.map((problem) => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            companySlug={
              problem.companySlug ||
              companySlugForProblemCard ||
              "unknown-company"
            }
            initialIsBookmarked={problem.isBookmarked}
            onBookmarkChanged={onBookmarkChanged}
            problemStatus={problem.currentStatus || "none"}
            onProblemStatusChange={onProblemStatusChange}
          />
        ))}
      </div>
    </TooltipProvider>
  );
};

// Optimized with React.memo to prevent unnecessary re-renders when parent components update
// but props (especially the problems array) remain referentially stable.
const MemoizedProfileProblemList = memo(ProfileProblemList);
MemoizedProfileProblemList.displayName = "ProfileProblemList";

export default MemoizedProfileProblemList;
