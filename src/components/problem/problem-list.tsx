
'use client';

import type { LeetCodeProblem, ProblemListFilters, PaginatedProblemsResponse, ProblemStatus } from '@/types';
import { useState, useEffect, useCallback, useRef } from 'react';
import ProblemCard from './problem-card';
import ProblemListControls from './problem-list-controls';
import { useAuth } from '@/contexts/auth-context';
import { fetchProblemsForCompanyPage } from '@/app/actions/problem.actions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce'; // Import useDebounce

interface ProblemListProps {
  companyId: string;
  companySlug: string;
  initialProblems: LeetCodeProblem[];
  initialTotalPages: number;
  initialCurrentPage: number;
  itemsPerPage: number;
  initialFilters: ProblemListFilters;
}

const ProblemList: React.FC<ProblemListProps> = ({
  companyId,
  companySlug,
  initialProblems,
  initialTotalPages,
  initialCurrentPage,
  itemsPerPage,
  initialFilters,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ProblemListFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.searchTerm);
  const debouncedSearchTerm = useDebounce(searchInput, 500);

  const [displayedProblems, setDisplayedProblems] = useState<LeetCodeProblem[]>(initialProblems);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialCurrentPage < initialTotalPages);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Effect to synchronize props to state when initial props change
  useEffect(() => {
    setDisplayedProblems(initialProblems);
    setCurrentPage(initialCurrentPage);
    setTotalPages(initialTotalPages);
    setHasMore(initialCurrentPage < initialTotalPages);
    setSearchInput(initialFilters.searchTerm);
    setFilters(initialFilters);
  }, [initialProblems, initialCurrentPage, initialTotalPages, initialFilters]);


  const handleFilterChange = useCallback(async (newFiltersApplied: Partial<ProblemListFilters>) => {
    const updatedFilters = { ...filters, ...newFiltersApplied, page: 1 }; // Reset to page 1 on filter change
    setFilters(updatedFilters);
    setCurrentPage(1);
    setIsLoading(true);
    // DO NOT clear displayedProblems here immediately. Let the fetch result dictate.

    try {
      const result = await fetchProblemsForCompanyPage({
        companyId,
        page: 1,
        pageSize: itemsPerPage,
        filters: updatedFilters,
        userId: user?.uid,
      });

      if ('error' in result) {
        toast({ title: 'Error Fetching Problems', description: result.error, variant: 'destructive' });
        setDisplayedProblems([]); // Clear problems if fetch fails
        setTotalPages(1);
        setHasMore(false);
      } else {
        setDisplayedProblems(result.problems);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setHasMore(result.currentPage < result.totalPages);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch problems.', variant: 'destructive' });
      setDisplayedProblems([]); // Clear problems on catch
      setTotalPages(1);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, itemsPerPage, user?.uid, toast, filters]); // filters is a dependency

  // Effect to handle debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== filters.searchTerm) {
      handleFilterChange({ searchTerm: debouncedSearchTerm });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, filters.searchTerm]); // handleFilterChange is not added to avoid potential loops if its definition changes

  // Effect to refresh problems with user-specific data when user logs in/out or if initial problems didn't have this data.
  useEffect(() => {
    const needsUserSpecificDataRefresh =
      user &&
      displayedProblems.length > 0 &&
      displayedProblems.some(p => typeof p.isBookmarked === 'undefined' || typeof p.currentStatus === 'undefined');

    if (needsUserSpecificDataRefresh) {
      handleFilterChange(filters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only re-run when user changes; displayedProblems and filters handled by handleFilterChange itself


  const loadMoreProblems = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPageToFetch = currentPage + 1;

    try {
      const result = await fetchProblemsForCompanyPage({
        companyId,
        page: nextPageToFetch,
        pageSize: itemsPerPage,
        filters,
        userId: user?.uid,
      });

      if ('error' in result) {
        toast({ title: 'Error Fetching More Problems', description: result.error, variant: 'destructive' });
        setHasMore(false);
      } else {
        setDisplayedProblems(prev => [...prev, ...result.problems]);
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);
        setHasMore(result.currentPage < result.totalPages);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load more problems.', variant: 'destructive' });
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, currentPage, itemsPerPage, companyId, filters, user?.uid, toast]);

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
        // If the current status filter would hide this problem, re-fetch with current filters
        // This ensures the list accurately reflects the filter criteria after a status change
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
