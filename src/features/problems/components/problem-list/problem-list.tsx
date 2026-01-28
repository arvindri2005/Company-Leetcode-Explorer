"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FilterX, Loader2 } from "lucide-react";

import { loadMoreProblemsAction } from "@/app/actions/problem.actions";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/hooks/use-toast";
import { parseArrayValid } from "@/lib/utils";
import { useAuth } from "@/providers";

import type {
  DifficultyFilter,
  LastAskedFilter,
  LeetCodeProblem,
  ProblemListFilters,
  ProblemStatus,
  SortKey,
  StatusFilter,
} from "../../types";
import ProblemCard, { type ProblemCardProps } from "../problem-card/problem-card";
import ProblemCardErrorFallback from "../problem-card/problem-card-error-fallback";

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

// Optimization: Hoist fallback component to prevent unnecessary re-creation on render
const FALLBACK = <ProblemCardErrorFallback />;

// Optimization: Memoize the ErrorBoundary wrapper to prevent ErrorBoundary from re-rendering
// when parent re-renders but props (ProblemCard props) haven't changed.
const ProblemCardWithErrorBoundary = React.memo((props: ProblemCardProps & { userId?: string }) => (
  <ErrorBoundary fallback={FALLBACK}>
    <ProblemCard {...props} />
  </ErrorBoundary>
));
ProblemCardWithErrorBoundary.displayName = "ProblemCardWithErrorBoundary";

interface ProblemListProps {
  companyId: string;
  companySlug: string;
  initialProblems: LeetCodeProblem[];
  initialHasMore: boolean;
  initialNextCursor?: string;
  itemsPerPage: number;
  initialFilters: ProblemListFilters;
  totalProblemCount?: number;
  difficultyCounts?: { Easy: number; Medium: number; Hard: number };
  totalPages: number;
  currentPage: number;
}

const ProblemList: React.FC<ProblemListProps> = ({
  companyId,
  companySlug,
  initialProblems,
  initialHasMore,
  initialNextCursor,
  itemsPerPage,
  initialFilters,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [displayedProblems, setDisplayedProblems] =
    useState<LeetCodeProblem[]>(initialProblems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(
    initialNextCursor
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Optimistic/Global Status State
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());
  const [attemptedProblemIds, setAttemptedProblemIds] = useState<Set<string>>(new Set());
  const [bookmarkedProblemIds, setBookmarkedProblemIds] = useState<Set<string>>(new Set());
  const [areGlobalStatsLoaded, setAreGlobalStatsLoaded] = useState(false);

  // Optimization: Track global stats loaded state in a ref to use in callbacks without dependency changes
  const areGlobalStatsLoadedRef = useRef(areGlobalStatsLoaded);
  useEffect(() => {
    areGlobalStatsLoadedRef.current = areGlobalStatsLoaded;
  }, [areGlobalStatsLoaded]);

  // -- Helper to derive current filters from URL --
  // Optimization: Use searchParams directly instead of redundant cloning
  // Optimization: Memoize the object to prevent ProblemListControls from re-rendering
  // on every ProblemList render (e.g. infinite scroll, status toggle)
  const currentFilters = useMemo((): ProblemListFilters => {
    return {
      difficultyFilter: parseArrayValid(searchParams.getAll("difficultyFilter"), [
        "Easy",
        "Medium",
        "Hard",
      ]) as DifficultyFilter[],
      lastAskedFilter: parseArrayValid(searchParams.getAll("lastAskedFilter"), [
        "last_30_days",
        "within_3_months",
        "within_6_months",
        "older_than_6_months",
      ]) as LastAskedFilter[],
      statusFilter: parseArrayValid(searchParams.getAll("statusFilter"), [
        "solved",
        "attempted",
        "todo",
      ]) as StatusFilter[],
      searchTerm: searchParams.get("searchTerm") || "",
      sortKey: (searchParams.get("sortKey") || "title") as SortKey,
    };
  }, [searchParams]);

  // -- Filter Handling (URL Sync) --
  const handleFilterChange = useCallback(
    (newFiltersApplied: Partial<ProblemListFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update params based on newFiltersApplied
      Object.entries(newFiltersApplied).forEach(([key, value]) => {
        params.delete(key);
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value) {
          params.set(key, value as string);
        }
      });

      // Reset page to 1 (or remove it) when filters change
      params.delete("page");

      router.push(pathname + "?" + params.toString(), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // -- Optimized Handlers for ProblemListControls --
  // These stable callbacks prevent ProblemListControls from re-rendering
  // when ProblemList re-renders (e.g. during infinite scroll)
  const handleDifficultyChange = useCallback(
    (value: DifficultyFilter[]) => {
      handleFilterChange({ difficultyFilter: value });
    },
    [handleFilterChange]
  );

  const handleSortKeyChange = useCallback(
    (value: SortKey) => {
      handleFilterChange({ sortKey: value });
    },
    [handleFilterChange]
  );

  const handleLastAskedChange = useCallback(
    (value: LastAskedFilter[]) => {
      handleFilterChange({ lastAskedFilter: value });
    },
    [handleFilterChange]
  );

  const handleStatusChange = useCallback(
    (value: StatusFilter[]) => {
      handleFilterChange({ statusFilter: value });
    },
    [handleFilterChange]
  );

  // -- Client-Side Fetch on Params Change --
  useEffect(() => {
    const fetchFilteredProblems = async () => {
      // Optimization: Use searchParams directly to avoid redundant URLSearchParams instantiation
      const difficultyFilter = parseArrayValid(
        searchParams.getAll("difficultyFilter"),
        ["Easy", "Medium", "Hard"],
      ) as DifficultyFilter[];

        const lastAskedFilter = parseArrayValid(searchParams.getAll("lastAskedFilter"), [
            "last_30_days",
            "within_3_months",
            "within_6_months",
            "older_than_6_months",
        ]) as LastAskedFilter[];

         const statusFilter = parseArrayValid(searchParams.getAll("statusFilter"), [
            "solved",
            "attempted",
            "todo",
         ]) as StatusFilter[];

        const searchTerm = searchParams.get("searchTerm") || "";
        const sortKey = (searchParams.get("sortKey") || "title") as SortKey;

        // Check if current filters are "default" (matching initial props)
        const isDefault = 
            difficultyFilter.length === 0 &&
            lastAskedFilter.length === 0 &&
            statusFilter.length === 0 &&
            searchTerm === "" &&
            sortKey === "title";

        if (isDefault) {
             // If default, we can use the initial props (which are static/SSR'd default)
            setDisplayedProblems(initialProblems);
             setHasMore(initialHasMore);
             setNextCursor(initialNextCursor);
            return;
        }

        setIsLoadingMore(true);
        
        try {
            // Using loadMoreProblemsAction with null cursor to start fresh
            const result = await loadMoreProblemsAction(
                companyId,
                null,
                {
                  difficultyFilter,
                  lastAskedFilter,
                  statusFilter,
                  searchTerm,
                  sortKey
                },
                itemsPerPage
            );

            if (!result.success || !result.data) {
                 toast({
                     title: "Error",
                     description: result.error?.message || "Failed to load filtered problems.",
                     variant: "destructive",
                 });
            } else {
                 setDisplayedProblems(result.data.problems);
                 setNextCursor(result.data.nextCursor);
                 setHasMore(result.data.hasMore ?? false);
            }

        } catch (error) {
            console.error("Failed to fetch filtered problems", error);
            toast({
                title: "Error",
                description: "Failed to load filtered problems.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingMore(false);
        }
    };

    fetchFilteredProblems();
  }, [searchParams, initialProblems, initialHasMore, initialNextCursor, companyId, itemsPerPage, toast, initialFilters]);

  // -- Optimized User Data Hydration (Aggregate Pattern) --

  // 1. Fetch Global Stats on Mount (once per user session/mount)
  useEffect(() => {
    if (!user) {
        setSolvedProblemIds(new Set());
        setAttemptedProblemIds(new Set());
        setBookmarkedProblemIds(new Set());
        setAreGlobalStatsLoaded(false);
        return;
    }

    const fetchGlobalStats = async () => {
        try {
            const result = await userService.getUserGlobalProblemStats(user.uid);
            if (result.isSuccess) {
              setSolvedProblemIds(new Set(result.value.solvedProblemIds));
              setAttemptedProblemIds(new Set(result.value.attemptedProblemIds));
              setBookmarkedProblemIds(new Set(result.value.bookmarkedProblemIds));
              setAreGlobalStatsLoaded(true);
            }
        } catch (error) {
            console.error("Error fetching global stats:", error);
        }
    };

    fetchGlobalStats();
  }, [user]);

  // 2. Derive merged problems (Global Stats + Local Data)
  // This replaces the previous useEffect to avoid double-renders
  const mergedProblems = useMemo(() => {
    if (!areGlobalStatsLoaded) {return displayedProblems;}

    return displayedProblems.map((p) => {
      let newStatus: ProblemStatus = "none";
      if (solvedProblemIds.has(p.id)) {newStatus = "solved";}
      else if (attemptedProblemIds.has(p.id)) {newStatus = "attempted";}

      const isBookmarked = bookmarkedProblemIds.has(p.id);

      // Preserve referential identity if nothing changed
      if (p.currentStatus === newStatus && p.isBookmarked === isBookmarked) {
        return p;
      }

      return { ...p, currentStatus: newStatus, isBookmarked: isBookmarked };
    });
  }, [
    displayedProblems,
    areGlobalStatsLoaded,
    solvedProblemIds,
    attemptedProblemIds,
    bookmarkedProblemIds,
  ]);

  const handleProblemBookmarkChange = useCallback(
    (problemId: string, newIsBookmarked: boolean) => {
      // Optimization: If global stats are loaded, mergedProblems derives state from the Sets.
      // We skip the redundant O(N) update of displayedProblems.
      if (!areGlobalStatsLoadedRef.current) {
        setDisplayedProblems((prev) =>
          prev.map((p) =>
            p.id === problemId ? { ...p, isBookmarked: newIsBookmarked } : p
          )
        );
      }
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
      // Optimization: If global stats are loaded, mergedProblems derives state from the Sets.
      // We skip the redundant O(N) update of displayedProblems.
      if (!areGlobalStatsLoadedRef.current) {
        setDisplayedProblems((prev) =>
          prev.map((p) =>
            p.id === problemId ? { ...p, currentStatus: newStatus } : p
          )
        );
      }

      // Update local Sets for optimistic UI
      if (newStatus === 'solved') {
          setSolvedProblemIds(prev => new Set(prev).add(problemId));
          setAttemptedProblemIds(prev => {
              const next = new Set(prev);
              next.delete(problemId); 
              return next; 
          });
      } else if (newStatus === 'attempted') {
          setAttemptedProblemIds(prev => new Set(prev).add(problemId));
          setSolvedProblemIds(prev => {
              const next = new Set(prev);
              next.delete(problemId);
              return next;
          });
      } else {
          // Cleared status
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

  // -- Infinite Scroll Logic --
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreProblems = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) {return;}

    setIsLoadingMore(true);
    try {
      const result = await loadMoreProblemsAction(
        companyId,
        nextCursor,
        currentFilters,
        itemsPerPage
      );

      if (!result.success || !result.data) {
        toast({
          title: "Error loading problems",
          description: result.error?.message || "Could not load more problems. Please try again.",
          variant: "destructive",
        });
      } else {
        const { problems: newProblems, nextCursor: newCursor, hasMore: newHasMore } = result.data;
        
        setDisplayedProblems((prev) => [...prev, ...newProblems]);
        setNextCursor(newCursor);
        setHasMore(newHasMore ?? false);
      }
    } catch (error) {
        console.error("Failed to load more problems", error);
      toast({
        title: "Error",
        description: "Failed to load more problems.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    nextCursor,
    companyId,
    currentFilters,
    itemsPerPage,
    toast,
  ]);

  // Optimization: Keep the latest loadMoreProblems in a ref to avoid re-creating the observer
  // every time the loading state or cursor changes.
  const loadMoreProblemsRef = useRef(loadMoreProblems);
  useEffect(() => {
    loadMoreProblemsRef.current = loadMoreProblems;
  }, [loadMoreProblems]);

  // Optimization: Use a callback ref to handle the sentinel element's lifecycle.
  // This ensures the observer is only created when the element actually mounts,
  // and isn't destroyed/recreated unnecessarily when dependencies change.
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreProblemsRef.current();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
      observerRef.current = observer;
    }
  }, []);



  return (
    // Optimization: Hoist TooltipProvider to reduce context creation for each ProblemCard (performance)
    <TooltipProvider delayDuration={300}>
      <div>
        <h2 className="sr-only">Problems</h2>
        <ProblemListControls
          difficultyFilter={currentFilters.difficultyFilter}
        onDifficultyFilterChange={handleDifficultyChange}
        sortKey={currentFilters.sortKey}
        onSortKeyChange={handleSortKeyChange}
        lastAskedFilter={currentFilters.lastAskedFilter}
        onLastAskedFilterChange={handleLastAskedChange}
        statusFilter={currentFilters.statusFilter}
        onStatusFilterChange={handleStatusChange}
        showStatusFilter={!!user}
      />

      {mergedProblems.length > 0 ? (
        <div className="space-y-4">
          {mergedProblems.map((problem, index) => (
            <div key={problem.id}>
              <ProblemCardWithErrorBoundary
                problem={problem}
                companySlug={problem.companySlug || companySlug}
                initialIsBookmarked={problem.isBookmarked}
                onBookmarkChanged={handleProblemBookmarkChange}
                problemStatus={problem.currentStatus || "none"}
                onProblemStatusChange={handleProblemStatusChange}
                userId={user?.uid}
              />
              {(index + 1) % 20 === 0 && (
                <AdPlaceholder className="my-4 h-32" title="Sponsored" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="bg-muted/50 p-4 rounded-full mb-4">
            <FilterX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No problems found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            We couldn&apos;t find any problems matching your current filters. Try
            adjusting your search or filters.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(pathname, { scroll: false })}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Infinite Scroll Sentinel / Loading Indicator */}
        {(hasMore || isLoadingMore) && (
          <div
            ref={loadMoreRef}
            className="py-8 flex justify-center items-center w-full"
          >
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ProblemList;
