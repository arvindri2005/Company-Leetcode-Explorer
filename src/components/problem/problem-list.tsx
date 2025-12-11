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
import { getUserProblemStatusesForIdsAction } from "@/app/actions/user.actions";
import { loadMoreProblemsAction } from "@/app/actions/problem.actions";
import { Loader2 } from "lucide-react";

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
  // totalPages and currentPage are unused in infinite scroll, but kept for interface compatibility if needed
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

  // Sync state with props when filters change (server re-renders)
  useEffect(() => {
    setDisplayedProblems(initialProblems);
    setHasMore(initialHasMore);
    setNextCursor(initialNextCursor);
    // Clear hydration cache because we are resetting 'displayedProblems'
    hydratedIdsRef.current.clear();
  }, [initialProblems, initialHasMore, initialNextCursor]);

  // -- Optimized User Data Hydration --
  const hydratedIdsRef = useRef<Set<string>>(new Set());

  // Reset hydration cache if user changes (e.g. login/logout)
  useEffect(() => {
    hydratedIdsRef.current.clear();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;

    // Identify which displayed problems haven't been hydrated yet
    const idsToHydrate = displayedProblems
      .map((p) => p.id)
      .filter((id) => !hydratedIdsRef.current.has(id));

    if (idsToHydrate.length === 0) return;

    // Mark as hydrated immediately to prevent double-firing
    idsToHydrate.forEach((id) => hydratedIdsRef.current.add(id));

    const fetchStatus = async () => {
      try {
        const result = await getUserProblemStatusesForIdsAction(
          user.uid,
          idsToHydrate
        );

        if ("error" in result) {
          console.error("Error fetching statuses:", result.error);
          return;
        }

        setDisplayedProblems((prev) =>
          prev.map((p) => {
            if (result[p.id]) {
              return {
                ...p,
                isBookmarked: result[p.id].isBookmarked,
                currentStatus: result[p.id].status,
              };
            }
            return p;
          })
        );
      } catch (error) {
        console.error("Failed to hydrate user data", error);
      }
    };

    fetchStatus();
  }, [displayedProblems, user]);

  const handleProblemBookmarkChange = useCallback(
    (problemId: string, newIsBookmarked: boolean) => {
      setDisplayedProblems((prev) =>
        prev.map((p) =>
          p.id === problemId ? { ...p, isBookmarked: newIsBookmarked } : p
        )
      );
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
        initialFilters,
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
    initialFilters,
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
        difficultyFilter={initialFilters.difficultyFilter}
        onDifficultyFilterChange={(value) =>
          handleFilterChange({ difficultyFilter: value })
        }
        sortKey={initialFilters.sortKey}
        onSortKeyChange={(value) =>
          handleFilterChange({ sortKey: value as SortKey })
        }
        lastAskedFilter={initialFilters.lastAskedFilter}
        onLastAskedFilterChange={(value) =>
          handleFilterChange({ lastAskedFilter: value })
        }
        statusFilter={initialFilters.statusFilter}
        onStatusFilterChange={(value) =>
          handleFilterChange({ statusFilter: value })
        }
        problemCount={displayedProblems.length}
        showStatusFilter={!!user}
      />

      {displayedProblems.length > 0 ? (
        <div className="space-y-4">
          {displayedProblems.map((problem, index) => (
            <div key={problem.id}>
              <ProblemCard
                problem={problem}
                companySlug={problem.companySlug || companySlug}
                initialIsBookmarked={problem.isBookmarked}
                onBookmarkChanged={handleProblemBookmarkChange}
                problemStatus={problem.currentStatus || "none"}
                onProblemStatusChange={handleProblemStatusChange}
              />
              {(index + 1) % 8 === 0 && (
                <AdPlaceholder className="my-4 h-32" title="Sponsored" />
              )}
            </div>
          ))}
        </div>
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
