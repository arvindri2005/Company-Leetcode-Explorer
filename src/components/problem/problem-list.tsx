
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
  const [searchInput, setSearchInput] = useState(initialFilters.searchTerm); // Local state for immediate search input
  const debouncedSearchTerm = useDebounce(searchInput, 500); // Debounced search term

  const [displayedProblems, setDisplayedProblems] = useState<LeetCodeProblem[]>(initialProblems);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false); 
  const [isLoadingMore, setIsLoadingMore] = useState(false); 
  const [hasMore, setHasMore] = useState(initialCurrentPage < initialTotalPages);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDisplayedProblems(initialProblems);
    setCurrentPage(initialCurrentPage);
    setTotalPages(initialTotalPages);
    setHasMore(initialCurrentPage < initialTotalPages);
    setSearchInput(initialFilters.searchTerm); // Sync searchInput when initialFilters change
    // Note: filters state itself is also reset if initialFilters change due to key prop or direct reset logic if any
  }, [initialProblems, initialCurrentPage, initialTotalPages, initialFilters]);


  const handleFilterChange = useCallback(async (newFiltersApplied: Partial<ProblemListFilters>) => {
    const updatedFilters = { ...filters, ...newFiltersApplied };
    setFilters(updatedFilters);
    setCurrentPage(1); 
    setIsLoading(true);
    setDisplayedProblems([]); 
    setHasMore(false); 

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
        setDisplayedProblems([]);
        setTotalPages(1);
      } else {
        setDisplayedProblems(result.problems);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setHasMore(result.currentPage < result.totalPages);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch problems.', variant: 'destructive' });
      setDisplayedProblems([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, itemsPerPage, user?.uid, toast, filters]); // `filters` is a dependency

  // Effect to handle debounced search term changes
  useEffect(() => {
    // Only trigger if the debounced search term is different from the current search term in active filters
    if (debouncedSearchTerm !== filters.searchTerm) {
      handleFilterChange({ searchTerm: debouncedSearchTerm });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [debouncedSearchTerm, filters.searchTerm]); // handleFilterChange is memoized but depends on `filters`, direct inclusion could cause loop if not careful. The condition `debouncedSearchTerm !== filters.searchTerm` is key.

  useEffect(() => {
    const needsUserSpecificDataRefresh =
      user &&
      displayedProblems.length > 0 &&
      displayedProblems.some(p => typeof p.isBookmarked === 'undefined' || typeof p.currentStatus === 'undefined');

    if (needsUserSpecificDataRefresh) {
      handleFilterChange(filters); // Pass current filters
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialProblems]);


  const loadMoreProblems = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPageToFetch = currentPage + 1;

    try {
      const result = await fetchProblemsForCompanyPage({
        companyId,
        page: nextPageToFetch,
        pageSize: itemsPerPage,
        filters, // Use current filters for pagination
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
  
  const handleProblemBookmarkChange = (problemId: string, newIsBookmarked: boolean) => {
    setDisplayedProblems(prev => 
      prev.map(p => p.id === problemId ? { ...p, isBookmarked: newIsBookmarked } : p)
    );
  };

  const handleProblemStatusChange = (problemId: string, newStatus: ProblemStatus) => {
     setDisplayedProblems(prev => 
      prev.map(p => p.id === problemId ? { ...p, currentStatus: newStatus } : p)
    );
    if (filters.statusFilter !== 'all' && filters.statusFilter !== newStatus && !(filters.statusFilter === 'none' && newStatus !== 'none')) {
        // If an active status filter is set and problem status changes to something that would filter it out,
        // or if it changes to match a filter it previously didn't.
        // We re-apply all current filters, which will include the updated status implicitly.
        handleFilterChange({ statusFilter: filters.statusFilter }); 
    }
  };


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
        searchTerm={searchInput} // Pass immediate searchInput to controls
        onSearchTermChange={setSearchInput} // Controls update searchInput directly
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
