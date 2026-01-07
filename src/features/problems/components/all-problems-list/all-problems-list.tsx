"use client";

import type {
  LeetCodeProblem,
  ProblemListFilters,
  ProblemStatus,
  SortKey,
} from "../../types";
import {
  DifficultySchema,
  LastAskedPeriodSchema,
  ProblemStatusSchema,
} from "../../types";
import { useState, useEffect, useCallback, useRef } from "react";
import ProblemCard from "../problem-card/problem-card";
import ErrorBoundary from "@/components/ui/error-boundary";
import ProblemCardErrorFallback from "../problem-card/problem-card-error-fallback";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { userService } from "@/services/user.service";
import { parseArrayValid } from "@/lib/utils";

const ProblemListControls = dynamic(() => import("../problem-list-controls/problem-list-controls"), {
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
  // initialFilters, // unused in body
  // totalPages, // unused in body
  // currentPage, // unused in body
  hasMore = false,
  initialNextCursor,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // State for infinite scroll
  const [displayedProblems, setDisplayedProblems] = useState<LeetCodeProblem[]>(initialProblems);
  const [cursor, setCursor] = useState<string | undefined>(initialNextCursor);
  const [hasMoreState, setHasMoreState] = useState<boolean>(hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Optimistic/Global Status State
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());
  const [attemptedProblemIds, setAttemptedProblemIds] = useState<Set<string>>(new Set());
  const [bookmarkedProblemIds, setBookmarkedProblemIds] = useState<Set<string>>(new Set());
  const [areGlobalStatsLoaded, setAreGlobalStatsLoaded] = useState(false);

  // Observer ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // Lifecycle ref to prevent updates on unmounted component
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // -- Filter Handling (URL Sync) --
  const handleFilterChange = useCallback(
    (newFiltersApplied: Partial<ProblemListFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update params based on newFiltersApplied
      Object.entries(newFiltersApplied).forEach(([key, value]) => {
        params.delete(key);
        if (Array.isArray(value)) {
           if (value.length > 0) {
              value.forEach((v) => params.append(key, v));
           }
        } else if (value) {
          params.set(key, value as string);
        }
      });
      
      // Reset page to 1 when filters change (though we rely on scroll mostly now)
      params.delete("page");

      router.push(pathname + "?" + params.toString(), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // -- Client-Side Fetch on Params Change --
  useEffect(() => {
    let ignore = false;

    const fetchFilteredProblems = async () => {
        const params = new URLSearchParams(searchParams.toString());
        
        const difficultyFilter = parseArrayValid(
            params.getAll("difficultyFilter"),
            DifficultySchema.options
        );

        const lastAskedFilter = parseArrayValid(
            params.getAll("lastAskedFilter"),
            LastAskedPeriodSchema.options
        );

         const statusFilter = parseArrayValid(
            params.getAll("statusFilter"),
            ProblemStatusSchema.options
         );

        const searchTerm = params.get("searchTerm") || "";
        const sortKey = (params.get("sortKey") || "title") as SortKey;

        // Check if current filters are "default" (matching initial props)
        const isDefault = 
            difficultyFilter.length === 0 &&
            lastAskedFilter.length === 0 &&
            statusFilter.length === 0 &&
            searchTerm === "" &&
            sortKey === "title";

        if (isDefault) {
            // If default, we can use the initial props (which are static/SSR'd default)
            if (ignore) return;
            setDisplayedProblems(initialProblems);
            setCursor(initialNextCursor);
            setHasMoreState(hasMore);
            // Clear hydration to allow hydrating defaults
            hydratedIdsRef.current.clear();
            return;
        }

        if (ignore) return;
        setIsLoadingMore(true); 
        
        try {
            const { fetchProblemsAction } = await import("@/app/actions/problem.actions");
            if (ignore) return;

            const result = await fetchProblemsAction({
                difficultyFilter,
                lastAskedFilter,
                statusFilter,
                searchTerm,
                sortKey
            }, itemsPerPage); // fetch first page
            
            if (ignore) return;

            setDisplayedProblems(result.problems);
            setCursor(result.nextCursor);
            setHasMoreState(result.hasMore ?? false);
            hydratedIdsRef.current.clear();
        } catch (error) {
            if (ignore) return;
            console.error("Failed to fetch filtered problems", error);
            toast({
                title: "Error",
                description: "Failed to load filtered problems.",
                variant: "destructive",
            });
        } finally {
            if (!ignore) {
                setIsLoadingMore(false);
            }
        }
    };

    fetchFilteredProblems();

    return () => {
        ignore = true;
    };
  }, [searchParams, initialProblems, initialNextCursor, hasMore, itemsPerPage, toast]);


  // -- Helper to derive current filters from URL --
  const getCurrentFilters = useCallback((): ProblemListFilters => {
     const params = new URLSearchParams(searchParams.toString());
      
     return {
        difficultyFilter: parseArrayValid(params.getAll("difficultyFilter"), DifficultySchema.options),
        lastAskedFilter: parseArrayValid(params.getAll("lastAskedFilter"), LastAskedPeriodSchema.options),
        statusFilter: parseArrayValid(params.getAll("statusFilter"), ProblemStatusSchema.options),
        searchTerm: params.get("searchTerm") || "",
        sortKey: (params.get("sortKey") || "title") as SortKey,
     };
  }, [searchParams]);

  // -- Infinite Scroll Loader --
  const loadMore = useCallback(async () => {
    // If not mounted, abort early
    if (!isMountedRef.current) return;
    if (isLoadingMore || !hasMoreState || !cursor) return;

    setIsLoadingMore(true);
    try {
      const { loadMoreAllProblemsAction } = await import("@/app/actions/problem.actions");
      const currentFilters = getCurrentFilters();
      
      const result = await loadMoreAllProblemsAction(
          cursor, 
          currentFilters, // Use current filters!
          itemsPerPage
      );
      
      // Check mount status again after await
      if (!isMountedRef.current) return;

      if (result.problems.length > 0) {
        setDisplayedProblems((prev) => [...prev, ...result.problems]);
        setCursor(result.nextCursor);
        setHasMoreState(result.hasMore ?? false);
      } else {
        setHasMoreState(false);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Failed to load more problems", error);
      toast({
          title: "Error",
          description: "Failed to load more problems. Please try again.",
          variant: "destructive",
      });
    } finally {
      if (isMountedRef.current) {
         setIsLoadingMore(false);
      }
    }
  }, [cursor, hasMoreState, isLoadingMore, getCurrentFilters, itemsPerPage, toast]);

  // -- Intersection Observer --
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreState && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" } 
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMoreState, isLoadingMore]);


  // -- Optimized User Data Hydration --
  const hydratedIdsRef = useRef<Set<string>>(new Set());

  // 1. Fetch Global Stats on Mount (once per user session/mount)
  useEffect(() => {
    if (!user) {
        setSolvedProblemIds(new Set());
        setAttemptedProblemIds(new Set());
        setAreGlobalStatsLoaded(false);
        return;
    }

    const fetchGlobalStats = async () => {
        try {
            const result = await userService.getUserGlobalProblemStats(user.uid);
            // Check if still mounted (unlikely to unmount this fast, but good practice)
            // Ideally we'd use ignore pattern here too, but this is less critical as it's fire-and-forget logic usually
            // However, setting state on unmounted is bad.
            if (!isMountedRef.current) return;

            setSolvedProblemIds(new Set(result.solvedProblemIds));
            setAttemptedProblemIds(new Set(result.attemptedProblemIds));
            setBookmarkedProblemIds(new Set(result.bookmarkedProblemIds));
            setAreGlobalStatsLoaded(true);
        } catch (error) {
            console.error("Error fetching global stats:", error);
        }
    };

    fetchGlobalStats();
  }, [user]);

  // Reset hydration cache if user changes (e.g. login/logout)
  useEffect(() => {
    hydratedIdsRef.current.clear();
  }, [user?.uid]);


  const handleProblemBookmarkChange = useCallback(
    (problemId: string, newIsBookmarked: boolean) => {
      // Just update the Sets. Rerender will pick it up.
      if (newIsBookmarked) {
          setBookmarkedProblemIds(prev => new Set(prev).add(problemId));
      } else {
          setBookmarkedProblemIds(prev => {
              const next = new Set(prev);
              next.delete(problemId);
              return next;
          });
      }
    },
    []
  );

  const handleProblemStatusChange = useCallback(
    (problemId: string, newStatus: ProblemStatus) => {
      // Also update local Sets to reflect the change immediately without refetch
      if (newStatus === 'solved') {
          setSolvedProblemIds(prev => new Set(prev).add(problemId));
          setAttemptedProblemIds(prev => {
              const next = new Set(prev);
              next.delete(problemId); // Optionally remove from attempted if logic implies exclusive
              return next; 
          });
      } else if (newStatus === 'attempted') {
          setAttemptedProblemIds(prev => new Set(prev).add(problemId));
          // If moving from solved to attempted, unsolve it
          setSolvedProblemIds(prev => {
              const next = new Set(prev);
              next.delete(problemId);
              return next;
          });
      } else {
          // 'none' or 'todo' (if todo is status? usually todo is different list)
          // If status is cleared
          setSolvedProblemIds(prev => {
              const next = new Set(prev);
              next.delete(problemId);
              return next;
          });
           setAttemptedProblemIds(prev => {
              const next = new Set(prev);
              next.delete(problemId);
              return next;
          });
      }
    },
    []
  );

  const currentFilters = getCurrentFilters();

  return (
    <div>
      <h2 className="sr-only">All Problems</h2>

      <ProblemListControls
        difficultyFilter={currentFilters.difficultyFilter}
        onDifficultyFilterChange={(value) =>
           handleFilterChange({ difficultyFilter: value })
        }
        sortKey={currentFilters.sortKey}
        onSortKeyChange={(value) =>
           handleFilterChange({ sortKey: value as SortKey })
        }
        lastAskedFilter={currentFilters.lastAskedFilter}
        onLastAskedFilterChange={(value) =>
          handleFilterChange({ lastAskedFilter: value })
        }
        statusFilter={currentFilters.statusFilter}
        onStatusFilterChange={(value) =>
          handleFilterChange({ statusFilter: value })
        }
        showStatusFilter={!!user} 
      />

      
      {displayedProblems.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No problems match the current filters.
          </p>
      ) : (
        <div className="space-y-4">
          {displayedProblems.map((problem, index) => {
            // Derived state logic moved to render loop
            let computedStatus = problem.currentStatus || "none";
            let computedIsBookmarked = problem.isBookmarked;

            if (areGlobalStatsLoaded) {
               if (solvedProblemIds.has(problem.id)) computedStatus = "solved";
               else if (attemptedProblemIds.has(problem.id)) computedStatus = "attempted";
               else computedStatus = "none";
               
               computedIsBookmarked = bookmarkedProblemIds.has(problem.id);
            }

            return (
              <div key={problem.id}>
                <ErrorBoundary fallback={<ProblemCardErrorFallback />}>
                  <ProblemCard
                    problem={problem}
                    companySlug={problem.companySlug || "unknown"}
                    initialIsBookmarked={computedIsBookmarked}
                    onBookmarkChanged={handleProblemBookmarkChange}
                    problemStatus={computedStatus}
                    onProblemStatusChange={handleProblemStatusChange}
                    showCompanies={true}
                  />
                </ErrorBoundary>
                {(index + 1) % 25 === 0 && (
                  <div className="py-4">
                    <AdPlaceholder title="Sponsored" className="h-32 w-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Infinite Scroll Trigger */}
      {hasMoreState && (
        <div 
            ref={observerTarget}
            className="py-10 text-center text-muted-foreground"
        >
            {isLoadingMore ? "Loading more problems..." : "Scroll to load more"}
        </div>
      )}
    </div>
  );
};

export default AllProblemsList;
