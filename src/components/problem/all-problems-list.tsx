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
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getUserProblemStatusesForIdsAction } from "@/app/actions/user.actions";

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

import { PaginationControls } from "@/components/ui/pagination-controls";

// ... imports

interface AllProblemsListProps {
  initialProblems: LeetCodeProblem[];
  itemsPerPage: number;
  initialFilters: ProblemListFilters;
  totalPages: number;
  currentPage: number;
  hasMore?: boolean;
}

const AllProblemsList: React.FC<AllProblemsListProps> = ({
  initialProblems,
  itemsPerPage,
  initialFilters,
  totalPages,
  currentPage,
  hasMore = false,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // We rely on props for the initial list (filtered by server)
  const [displayedProblems, setDisplayedProblems] =
    useState<LeetCodeProblem[]>(initialProblems);
    
  console.log("AllProblemsList Pagination Debug:", {
    totalPages,
    currentPage,
    problemsCount: displayedProblems.length,
    hasMore,
  });

  // -- Filter Handling (URL Sync) --

  const handleFilterChange = useCallback(
    (newFiltersApplied: Partial<ProblemListFilters>) => {
      let params = new URLSearchParams(searchParams.toString());

      // Update params based on newFiltersApplied
      Object.entries(newFiltersApplied).forEach(([key, value]) => {
        params.delete(key);
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value) {
          params.set(key, value as string);
        }
      });
      
      // Reset page to 1 when filters change
      params.delete("page");

      router.push(pathname + "?" + params.toString(), { scroll: false });
    },
    [router, pathname, searchParams]
  );
  
  // -- Pagination URL Generation --
  const createPageUrl = useCallback((pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber > 1) {
      params.set("page", pageNumber.toString());
    } else {
      params.delete("page");
    }
    return `${pathname}?${params.toString()}`;
  }, [searchParams, pathname]);


  // Sync state with props when filters/page change (server re-renders)
  useEffect(() => {
    setDisplayedProblems(initialProblems);
    
    // Clear hydration cache because we are resetting 'displayedProblems'
    hydratedIdsRef.current.clear(); 
  }, [initialProblems]);

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

  return (
    <div>
      <h2 className="sr-only">All Problems</h2>

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
      
      {displayedProblems.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            No problems match the current filters.
          </p>
      ) : (
        <div className="space-y-4">
          {displayedProblems.map((problem, index) => (
            <div key={problem.id}>
              <ProblemCard
                problem={problem}
                companySlug={problem.companySlug || "unknown"}
                initialIsBookmarked={problem.isBookmarked}
                onBookmarkChanged={handleProblemBookmarkChange}
                problemStatus={problem.currentStatus || "none"}
                onProblemStatusChange={handleProblemStatusChange}
                showCompanies={true}
              />
              {(index + 1) % 25 === 0 && (
                <div className="py-4">
                  <AdPlaceholder title="Sponsored" className="h-32 w-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8">
        <PaginationControls 
            currentPage={currentPage || 1}
            totalPages={totalPages || 1}
            baseUrl={pathname}
            createPageUrl={createPageUrl}
            hideOnSinglePage={false}
            hasNextPage={hasMore}
        />
      </div>
    </div>
  );
};

export default AllProblemsList;
