"use client";

import React from "react";

import { useAuth } from "@/providers";

import { useProblemList } from "../../hooks/use-problem-list";
import type { LeetCodeProblem, ProblemListFilters } from "../../types";

import { ProblemListView } from "./problem-list-view";

interface AllProblemsListProps {
  initialProblems: LeetCodeProblem[];
  itemsPerPage: number;
  initialFilters: ProblemListFilters;
  totalPages: number;
  currentPage: number;
  hasMore?: boolean;
  initialNextCursor?: string;
}

const AllProblemsList: React.FC<AllProblemsListProps> = ({
  initialProblems,
  itemsPerPage,
  // initialFilters, // handled by hook via URL
  // totalPages, // unused
  // currentPage, // unused
  hasMore = false,
  initialNextCursor,
}) => {
  const { user } = useAuth();

  const {
    displayedProblems,
    hasMore: hasMoreState,
    isLoadingMore,
    currentFilters,
    globalStats,
    actions,
    observerTargetRef,
  } = useProblemList({
    initialProblems,
    itemsPerPage,
    hasMore,
    initialNextCursor,
  });

  return (
    <ProblemListView
      displayedProblems={displayedProblems}
      currentFilters={currentFilters}
      isLoadingMore={isLoadingMore}
      hasMore={hasMoreState}
      observerTargetRef={observerTargetRef}
      userId={user?.id}
      globalStats={globalStats}
      actions={actions}
    />
  );
};

export default AllProblemsList;
