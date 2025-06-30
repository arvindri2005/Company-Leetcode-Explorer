
'use client';

import type { LeetCodeProblem, ProblemListFilters, PaginatedProblemsResponse, ProblemStatus } from '@/types';
import { useState, useEffect, useCallback, useRef } from 'react';
import ProblemCard from './problem-card';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ProblemListControls = dynamic(() => import('./problem-list-controls'), {
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

  const [filters, setFilters] = useState<ProblemListFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.searchTerm);
  const debouncedSearchTerm = useDebounce(searchInput, 500);

  const [displayedProblems, setDisplayedProblems] = useState<LeetCodeProblem[]>(initialProblems);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDisplayedProblems(initialProblems);
    setHasMore(initialHasMore);
    setNextCursor(initialNextCursor);
    setSearchInput(initialFilters.searchTerm);
    setFilters(initialFilters);
  }, [initialProblems, initialHasMore, initialNextCursor, initialFilters]);

  const fetchProblems = useCallback(async (cursor?: string, newFilters?: Partial<ProblemListFilters>) => {
    const currentFilters = newFilters ? { ...filters, ...newFilters } : filters;
    if (!cursor) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
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
        setDisplayedProblems(prev => [...prev, ...result.problems]);
      } else {
        setDisplayedProblems(result.problems);
      }
      setHasMore(result.hasMore ?? false);
      setNextCursor(result.nextCursor);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: 'Error Fetching Problems', description: errorMessage, variant: 'destructive' });
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [companyId, itemsPerPage, user?.uid, toast, filters]);

  const handleFilterChange = useCallback((newFiltersApplied: Partial<ProblemListFilters>) => {
    const updatedFilters = { ...filters, ...newFiltersApplied };
    setFilters(updatedFilters);
    fetchProblems(undefined, updatedFilters);
  }, [filters, fetchProblems]);

  useEffect(() => {
    if (debouncedSearchTerm !== filters.searchTerm) {
      handleFilterChange({ searchTerm: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm, filters.searchTerm, handleFilterChange]);

  useEffect(() => {
    const needsUserSpecificDataRefresh =
      user &&
      displayedProblems.length > 0 &&
      displayedProblems.some(p => typeof p.isBookmarked === 'undefined' || typeof p.currentStatus === 'undefined');

    if (needsUserSpecificDataRefresh) {
      handleFilterChange(filters);
    }
  }, [user, displayedProblems, filters, handleFilterChange]);

  const loadMoreProblems = useCallback(() => {
    if (hasMore && nextCursor) {
      fetchProblems(nextCursor);
    }
  }, [hasMore, nextCursor, fetchProblems]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMoreProblems();
        }
      },
      { threshold: 1.0 }
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

  const handleProblemBookmarkChange = useCallback((problemId: string, newIsBookmarked: boolean) => {
    setDisplayedProblems(prev =>
      prev.map(p => p.id === problemId ? { ...p, isBookmarked: newIsBookmarked } : p)
    );
  }, []);

  const handleProblemStatusChange = useCallback((problemId: string, newStatus: ProblemStatus) => {
     setDisplayedProblems(prev =>
      prev.map(p => p.id === problemId ? { ...p, currentStatus: newStatus } : p)
    );
    if (filters.statusFilter !== 'all' && filters.statusFilter !== newStatus && !(filters.statusFilter === 'none' && newStatus !== 'none')) {
        handleFilterChange({ statusFilter: filters.statusFilter });
    }
  }, [filters.statusFilter, handleFilterChange]);

  return (
    <div>
      <ProblemListControls
        difficultyFilter={filters.difficultyFilter}
        onDifficultyFilterChange={(value) => handleFilterChange({ difficultyFilter: value })}
        sortKey={filters.sortKey}
        onSortKeyChange={(value) => handleFilterChange({ sortKey: value })}
        lastAskedFilter={filters.lastAskedFilter}
        onLastAskedFilterChange={(value) => handleFilterChange({ lastAskedFilter: value })}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={(value) => handleFilterChange({ statusFilter: value })}
        searchTerm={searchInput}
        onSearchTermChange={setSearchInput}
        problemCount={displayedProblems.length}
        showStatusFilter={!!user}
      />
      {isLoading && displayedProblems.length === 0 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading problems...</p>
        </div>
      ) : displayedProblems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProblems.map(problem => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              companySlug={problem.companySlug || companySlug}
              initialIsBookmarked={problem.isBookmarked}
              onBookmarkChanged={handleProblemBookmarkChange}
              problemStatus={problem.currentStatus || 'none'}
              onProblemStatusChange={handleProblemStatusChange}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          No problems match the current filters or search term for this company.
        </p>
      )}
      <div ref={loadMoreTriggerRef} className="h-10 flex items-center justify-center">
        {isLoadingMore && (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}
        {!isLoadingMore && !hasMore && displayedProblems.length > 0 && (
          <p className="text-muted-foreground text-sm">You've reached the end!</p>
        )}
      </div>
    </div>
  );
};

export default ProblemList;
