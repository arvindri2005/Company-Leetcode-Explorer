
'use client';

import type { LeetCodeProblem, ProblemListFilters, PaginatedProblemsResponse } from '@/types';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import ProblemCard from './problem-card';
import ProblemListControls from './problem-list-controls';
import { useAuth } from '@/contexts/auth-context';
import { fetchProblemsForCompanyPage } from '@/app/actions/problem.actions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProblemListProps {
  companyId: string;
  companySlug: string;
  initialProblems: LeetCodeProblem[];
  initialTotalPages: number;
  initialCurrentPage: number;
  itemsPerPage: number;
  initialFilters: ProblemListFilters; // For initializing filters from server if needed
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

  // State for filters, sort, and search term
  const [filters, setFilters] = useState<ProblemListFilters>(initialFilters);
  
  // State for displayed problems and pagination
  const [displayedProblems, setDisplayedProblems] = useState<LeetCodeProblem[]>(initialProblems);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false); // For initial load or filter changes
  const [isLoadingMore, setIsLoadingMore] = useState(false); // For infinite scroll
  const [hasMore, setHasMore] = useState(initialCurrentPage < initialTotalPages);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Effect to reset problems when initialProblems prop changes (e.g., from server after filter change)
  // This is now primarily for the very first load. Subsequent filter changes will fetch page 1.
  useEffect(() => {
    setDisplayedProblems(initialProblems);
    setCurrentPage(initialCurrentPage);
    setTotalPages(initialTotalPages);
    setHasMore(initialCurrentPage < initialTotalPages);
  }, [initialProblems, initialCurrentPage, initialTotalPages]);


  const handleFilterChange = useCallback(async (newFilters: Partial<ProblemListFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1); // Reset to page 1 on any filter change
    setIsLoading(true);
    setDisplayedProblems([]); // Clear current problems
    setHasMore(false); // Assume no more pages until fetch confirms

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
  }, [companyId, itemsPerPage, user?.uid, toast, filters]);


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
        setTotalPages(result.totalPages); // Update totalPages from server response
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
  
  // Handler for bookmark changes within ProblemCard
  const handleProblemBookmarkChange = (problemId: string, newIsBookmarked: boolean) => {
    setDisplayedProblems(prev => 
      prev.map(p => p.id === problemId ? { ...p, isBookmarked: newIsBookmarked } : p)
    );
  };

  // Handler for status changes within ProblemCard
  const handleProblemStatusChange = (problemId: string, newStatus: ProblemListFilters['statusFilter']) => {
     setDisplayedProblems(prev => 
      prev.map(p => p.id === problemId ? { ...p, currentStatus: newStatus } : p)
    );
    // If the status filter is active and the new status doesn't match, refetch to re-apply filter
    if (filters.statusFilter !== 'all' && filters.statusFilter !== newStatus) {
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
        searchTerm={filters.searchTerm}
        onSearchTermChange={(value) => handleFilterChange({ searchTerm: value })}
        problemCount={displayedProblems.length} // This should be totalProblems matching filter if available from backend
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
          No problems match the current filters or search term.
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
