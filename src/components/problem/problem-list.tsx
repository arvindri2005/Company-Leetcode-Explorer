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
             hydratedIdsRef.current.clear();
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
                 hydratedIdsRef.current.clear();
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
  }, [searchParams, initialProblems, initialHasMore, initialNextCursor, companyId, itemsPerPage, toast, initialFilters]); // initialFilters dependency is technically constant now

  // removed the old useEffect that synced solely on initialProblems change, as this new one covers it (via isDefault check)

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
              {(index + 1) % 20 === 0 && (
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
