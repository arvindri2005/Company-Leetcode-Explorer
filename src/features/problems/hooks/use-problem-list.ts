"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { userService } from "@/features/profile/services/user.service";
import { useAuth } from "@/providers";
import { useToast } from "@/shared/hooks/use-toast";
import { parseArrayValid } from "@/shared/lib/utils";

import { 
  DifficultySchema, 
  LastAskedPeriodSchema, 
  type LeetCodeProblem, 
  type ProblemListFilters, 
  type ProblemStatus,
  ProblemStatusSchema, 
  type SortKey} from "../types";

interface UseProblemListProps {
  initialProblems: LeetCodeProblem[];
  itemsPerPage: number;
  hasMore?: boolean;
  initialNextCursor?: string;
}

export function useProblemList({
  initialProblems,
  itemsPerPage,
  hasMore = false,
  initialNextCursor,
}: UseProblemListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // -- State --
  const [displayedProblems, setDisplayedProblems] = useState<LeetCodeProblem[]>(initialProblems);
  const [cursor, setCursor] = useState<string | undefined>(initialNextCursor);
  const [hasMoreState, setHasMoreState] = useState<boolean>(hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // -- Global Stats State --
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());
  const [attemptedProblemIds, setAttemptedProblemIds] = useState<Set<string>>(new Set());
  const [bookmarkedProblemIds, setBookmarkedProblemIds] = useState<Set<string>>(new Set());
  const [areGlobalStatsLoaded, setAreGlobalStatsLoaded] = useState(false);

  // -- Refs --
  const observerTarget = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const hydratedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // -- Filters --
  const currentFilters = useMemo((): ProblemListFilters => {
    return {
      difficultyFilter: parseArrayValid(searchParams.getAll("difficultyFilter"), DifficultySchema.options),
      lastAskedFilter: parseArrayValid(searchParams.getAll("lastAskedFilter"), LastAskedPeriodSchema.options),
      statusFilter: parseArrayValid(searchParams.getAll("statusFilter"), ProblemStatusSchema.options),
      searchTerm: searchParams.get("searchTerm") || "",
      sortKey: (searchParams.get("sortKey") || "title") as SortKey,
    };
  }, [searchParams]);

  const handleFilterChange = useCallback(
    (newFiltersApplied: Partial<ProblemListFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

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
      
      params.delete("page");
      router.push(pathname + "?" + params.toString(), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // -- Data Fetching: Filters --
  useEffect(() => {
    let ignore = false;

    const fetchFilteredProblems = async () => {
        const { difficultyFilter, lastAskedFilter, statusFilter, searchTerm, sortKey } = currentFilters;

        // Check if current filters are "default"
        const isDefault = 
            difficultyFilter.length === 0 &&
            lastAskedFilter.length === 0 &&
            statusFilter.length === 0 &&
            searchTerm === "" &&
            sortKey === "title";

        if (isDefault) {
            if (ignore) {return;}
            setDisplayedProblems(initialProblems);
            setCursor(initialNextCursor);
            setHasMoreState(hasMore);
            hydratedIdsRef.current.clear();
            return;
        }

        if (ignore) {return;}
        setIsLoadingMore(true); 
        
        try {
            const { fetchProblemsAction } = await import("@/app/actions/problem.actions");
            if (ignore) {return;}

            const result = await fetchProblemsAction({
                difficultyFilter,
                lastAskedFilter,
                statusFilter,
                searchTerm,
                sortKey
            }, itemsPerPage);
            
            if (ignore) {return;}

            if (result.success && result.data) {
              setDisplayedProblems(result.data.problems);
              setCursor(result.data.nextCursor);
              setHasMoreState(result.data.hasMore ?? false);
            }
            hydratedIdsRef.current.clear();
        } catch (error) {
            if (ignore) {return;}
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
  }, [currentFilters, initialProblems, initialNextCursor, hasMore, itemsPerPage, toast]);

  // -- Data Fetching: Load More --
  const loadMore = useCallback(async () => {
    if (!isMountedRef.current) {return;}
    if (isLoadingMore || !hasMoreState || !cursor) {return;}

    setIsLoadingMore(true);
    try {
      const { loadMoreAllProblemsAction } = await import("@/app/actions/problem.actions");
      
      const result = await loadMoreAllProblemsAction(
          cursor, 
          currentFilters,
          itemsPerPage
      );
      
      if (!isMountedRef.current) {return;}

      if (result.success && result.data && result.data.problems.length > 0) {
        setDisplayedProblems((prev) => [...prev, ...result.data!.problems]);
        setCursor(result.data.nextCursor);
        setHasMoreState(result.data.hasMore ?? false);
      } else if (result.success && result.data) {
        setHasMoreState(false);
      }
    } catch (error) {
      if (!isMountedRef.current) {return;}
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
  }, [cursor, hasMoreState, isLoadingMore, currentFilters, itemsPerPage, toast]);

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

  // -- User Stats --
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
            if (!isMountedRef.current) {return;}

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

  useEffect(() => {
    hydratedIdsRef.current.clear();
  }, [user?.uid]);

  const handleBookmarkChange = useCallback((problemId: string, newIsBookmarked: boolean) => {
    if (newIsBookmarked) {
        setBookmarkedProblemIds(prev => new Set(prev).add(problemId));
    } else {
        setBookmarkedProblemIds(prev => {
            const next = new Set(prev);
            next.delete(problemId);
            return next;
        });
    }
  }, []);

  const handleStatusChange = useCallback((problemId: string, newStatus: ProblemStatus) => {
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
  }, []);

  return {
    displayedProblems,
    hasMore: hasMoreState,
    isLoadingMore,
    currentFilters,
    globalStats: {
      solvedProblemIds,
      attemptedProblemIds,
      bookmarkedProblemIds,
      areLoaded: areGlobalStatsLoaded
    },
    actions: {
      handleFilterChange,
      handleBookmarkChange,
      handleStatusChange
    },
    observerTargetRef: observerTarget
  };
}
