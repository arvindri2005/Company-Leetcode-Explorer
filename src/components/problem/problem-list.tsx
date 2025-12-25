"use client";

import type { User } from "firebase/auth";

import type {
  LeetCodeProblem,
  ProblemListFilters,
  ProblemStatus,
  SortKey,
} from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";
import ProblemCard from "./problem-card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { userService } from "@/services/user.service";
import { loadMoreProblemsAction } from "@/app/actions/problem.actions";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // -- Helper to derive current filters from URL --
  const getCurrentFilters = useCallback((): ProblemListFilters => {
     const params = new URLSearchParams(searchParams.toString());
     const parseArrayValid = <T extends string>(
             val: string[] | null,
             validValues: T[]
        ): T[] => {
            if (!val) return [];
            return val.filter((v): v is T => validValues.includes(v as T));
        };
      
     return {
        difficultyFilter: parseArrayValid(params.getAll("difficultyFilter"), ["Easy", "Medium", "Hard"]) as any[],
        lastAskedFilter: parseArrayValid(params.getAll("lastAskedFilter"), ["last_30_days", "within_3_months", "within_6_months", "older_than_6_months"]) as any[],
        statusFilter: parseArrayValid(params.getAll("statusFilter"), ["solved", "attempted", "todo"]) as any[],
        searchTerm: params.get("searchTerm") || "",
        sortKey: (params.get("sortKey") || "title") as SortKey,
     };
  }, [searchParams]);

  const currentFilters = getCurrentFilters();

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

  // -- Client-Side Fetch on Params Change --
  useEffect(() => {
    const fetchFilteredProblems = async () => {
        const params = new URLSearchParams(searchParams.toString());
        
        // Helper to parse array filters
        const parseArrayValid = <T extends string>(
             val: string[] | null,
             validValues: T[]
        ): T[] => {
            if (!val) return [];
            return val.filter((v): v is T => validValues.includes(v as T));
        };

        const difficultyFilter = parseArrayValid(
            params.getAll("difficultyFilter"),
            ["Easy", "Medium", "Hard"]
        ) as any[];

        const lastAskedFilter = parseArrayValid(params.getAll("lastAskedFilter"), [
            "last_30_days",
            "within_3_months",
            "within_6_months",
            "older_than_6_months",
        ]) as any[];

         const statusFilter = parseArrayValid(params.getAll("statusFilter"), [
            "solved",
            "attempted",
            "todo",
         ]) as any[];

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

            if ("error" in result) {
                 toast({
                     title: "Error",
                     description: "Failed to load filtered problems.",
                     variant: "destructive",
                 });
            } else {
                 setDisplayedProblems(result.problems);
                 setNextCursor(result.nextCursor);
                 setHasMore(result.hasMore ?? false);
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

  // 2. Apply Global Statuses immediately if loaded
  useEffect(() => {
    if (!user) return;

    if (areGlobalStatsLoaded) {
        setDisplayedProblems((prev) => {
            let hasChanges = false;
            const next = prev.map(p => {
                let newStatus: ProblemStatus = "none";
                if (solvedProblemIds.has(p.id)) newStatus = "solved";
                else if (attemptedProblemIds.has(p.id)) newStatus = "attempted";

                const isBookmarked = bookmarkedProblemIds.has(p.id);

                 if (p.currentStatus !== newStatus || p.isBookmarked !== isBookmarked) {
                     hasChanges = true;
                     return { ...p, currentStatus: newStatus, isBookmarked: isBookmarked };
                 }
                return p;
            });
            return hasChanges ? next : prev;
        });
    }
  }, [displayedProblems, user, areGlobalStatsLoaded, solvedProblemIds, attemptedProblemIds, bookmarkedProblemIds]);

  const handleProblemBookmarkChange = useCallback(
    (problemId: string, newIsBookmarked: boolean) => {
      setDisplayedProblems((prev) =>
        prev.map((p) =>
          p.id === problemId ? { ...p, isBookmarked: newIsBookmarked } : p
        )
      );
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
      setDisplayedProblems((prev) =>
        prev.map((p) =>
          p.id === problemId ? { ...p, currentStatus: newStatus } : p
        )
      );
      
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
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMoreProblems = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    try {
      const result = await loadMoreProblemsAction(
        companyId,
        nextCursor,
        currentFilters,
        itemsPerPage
      );

      if ("error" in result) {
        toast({
          title: "Error loading problems",
          description: "Could not load more problems. Please try again.",
          variant: "destructive",
        });
      } else {
        const { problems: newProblems, nextCursor: newCursor, hasMore: newHasMore } = result;
        
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreProblems();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreProblems]);



  return (
    <div>
      <h2 className="sr-only">Problems</h2>
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
        problemCount={displayedProblems.length}
        showStatusFilter={!!user}
      />

      {displayedProblems.length > 0 ? (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {displayedProblems.map((problem, index) => (
              <motion.div
                key={problem.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 1,
                    },
                  },
                }}
              >
                <ProblemCard
                  problem={problem}
                  companySlug={problem.companySlug || companySlug}
                  initialIsBookmarked={problem.isBookmarked}
                  onBookmarkChanged={handleProblemBookmarkChange}
                  problemStatus={problem.currentStatus || "none"}
                  onProblemStatusChange={handleProblemStatusChange}
                />
                {(index + 1) % 20 === 0 && (
                  <AdPlaceholder className="my-4 h-32" title="Sponsored" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          No problems match the current filters or search term for this company.
        </p>
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
  );
};

export default ProblemList;
