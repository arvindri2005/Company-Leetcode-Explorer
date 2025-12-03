/**
 * @fileoverview A client-side component for displaying an interactive list of ALL coding problems.
 *
 * This component features a clean, table-based layout with enhanced user
 * interaction, sorting, filtering, and infinite scrolling.
 * It is similar to ProblemList but adapted for the global problems view (no company context).
 */
"use client";

import type {
  LeetCodeProblem,
  ProblemListFilters,
  PaginatedProblemsResponse,
  ProblemStatus,
  SortKey,
} from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";
import ProblemCard from "./problem-card";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import AdPlaceholder from "@/components/ads/ad-placeholder";

const ProblemListControls = dynamic(() => import("./problem-list-controls"), {
  loading: () => (
    <div className="mb-6 p-4 space-y-4 bg-card rounded-lg shadow">
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>
    </div>
  ),
});

interface AllProblemsListProps {
  initialProblems: LeetCodeProblem[];
  initialHasMore: boolean;
  initialNextCursor?: string;
  itemsPerPage: number;
  initialFilters: ProblemListFilters;
}

const AllProblemsList: React.FC<AllProblemsListProps> = ({
  initialProblems,
  initialHasMore,
  initialNextCursor,
  itemsPerPage,
  initialFilters,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ProblemListFilters>({
    ...initialFilters,
    difficultyFilter: [],
    lastAskedFilter: [],
    statusFilter: [],
  });

  const [displayedProblems, setDisplayedProblems] =
    useState<LeetCodeProblem[]>(initialProblems);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(
    initialNextCursor,
  );

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const fetchProblems = useCallback(
    async (cursor?: string, newFilters?: Partial<ProblemListFilters>) => {
      const currentFilters = newFilters
        ? { ...filters, ...newFilters }
        : filters;
      if (!cursor) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await fetch("/api/problems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // No companyId provided, so API will fetch all problems
            cursor,
            pageSize: itemsPerPage,
            filters: currentFilters,
            userId: user?.uid,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: PaginatedProblemsResponse = await response.json();

        if (cursor) {
          setDisplayedProblems((prev) => [...prev, ...result.problems]);
        } else {
          setDisplayedProblems(result.problems);
        }
        setHasMore(result.hasMore ?? false);
        setNextCursor(result.nextCursor);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        toast({
          title: "Error Fetching Problems",
          description: errorMessage,
          variant: "destructive",
        });
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [itemsPerPage, user?.uid, toast, filters],
  );

  const handleFilterChange = useCallback(
    (newFiltersApplied: Partial<ProblemListFilters>) => {
      const updatedFilters = { ...filters, ...newFiltersApplied };
      setFilters(updatedFilters);
      fetchProblems(undefined, updatedFilters);
    },
    [filters, fetchProblems],
  );

  const prevUserRef = useRef(user);

  useEffect(() => {
    const userJustLoggedIn = user && !prevUserRef.current;
    if (userJustLoggedIn) {
      handleFilterChange(filters);
    }
    prevUserRef.current = user;
  }, [user, filters, handleFilterChange]);

  const loadMoreProblems = useCallback(() => {
    if (hasMore && nextCursor) {
      fetchProblems(nextCursor);
    }
  }, [hasMore, nextCursor, fetchProblems]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          loadMoreProblems();
        }
      },
      { threshold: 1.0, rootMargin: "500px" },
    );

    const currentTriggerRef = loadMoreTriggerRef.current;
    if (currentTriggerRef) {
      observerRef.current.observe(currentTriggerRef);
    }

    return () => {
      if (observerRef.current && currentTriggerRef) {
        observerRef.current.unobserve(currentTriggerRef);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMoreProblems]);

  const handleProblemBookmarkChange = useCallback(
    (problemId: string, newIsBookmarked: boolean) => {
      setDisplayedProblems((prev) =>
        prev.map((p) =>
          p.id === problemId ? { ...p, isBookmarked: newIsBookmarked } : p,
        ),
      );
    },
    [],
  );

  const handleProblemStatusChange = useCallback(
    (problemId: string, newStatus: ProblemStatus) => {
      setDisplayedProblems((prev) =>
        prev.map((p) =>
          p.id === problemId ? { ...p, currentStatus: newStatus } : p,
        ),
      );
      if (
        filters.statusFilter.length > 0 &&
        !filters.statusFilter.includes(newStatus)
      ) {
        handleFilterChange({ statusFilter: filters.statusFilter });
      }
    },
    [filters.statusFilter, handleFilterChange],
  );

  return (
    <div>
      <h2 className="sr-only">All Problems</h2>
      <ProblemListControls
        difficultyFilter={filters.difficultyFilter}
        onDifficultyFilterChange={(value) =>
          handleFilterChange({ difficultyFilter: value })
        }
        sortKey={filters.sortKey}
        onSortKeyChange={(value) =>
          handleFilterChange({ sortKey: value as SortKey })
        }
        lastAskedFilter={filters.lastAskedFilter}
        onLastAskedFilterChange={(value) =>
          handleFilterChange({ lastAskedFilter: value })
        }
        statusFilter={filters.statusFilter}
        onStatusFilterChange={(value) =>
          handleFilterChange({ statusFilter: value })
        }
        problemCount={displayedProblems.length}
        showStatusFilter={!!user}
      />
      {isLoading && displayedProblems.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading problems...</p>
        </div>
      ) : displayedProblems.length > 0 ? (
        <div className="space-y-4">
          {displayedProblems.map((problem, index) => (
            <div key={problem.id}>
              <ProblemCard
                problem={problem}
                companySlug={problem.companySlug || "unknown"} // Fallback
                initialIsBookmarked={problem.isBookmarked}
                onBookmarkChanged={handleProblemBookmarkChange}
                problemStatus={problem.currentStatus || "none"}
                onProblemStatusChange={handleProblemStatusChange}
              />
              {(index + 1) % 8 === 0 && (
                <AdPlaceholder
                  className="my-4 h-32"
                  title="Sponsored"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          No problems match the current filters.
        </p>
      )}
      <div
        ref={loadMoreTriggerRef}
        className="h-10 flex items-center justify-center"
      >
        {isLoadingMore && (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}
        {!isLoadingMore && !hasMore && displayedProblems.length > 0 && (
          <p className="text-muted-foreground text-sm">
            You&apos;ve reached the end!
          </p>
        )}
      </div>
    </div>
  );
};

export default AllProblemsList;
