'use client';

import type { Company } from '@/types';
import { useState, useEffect, useRef, useCallback } from 'react';
import CompanyCard from './company-card';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchCompaniesAction } from '@/app/actions'; // Server action for fetching more companies

interface CompanyListProps {
  initialCompanies: Company[];
  initialSearchTerm?: string;
  initialTotalPages: number;
  itemsPerPage: number;
}

const CompanyList: React.FC<CompanyListProps> = ({ 
  initialCompanies, 
  initialSearchTerm = '',
  initialTotalPages,
  itemsPerPage,
}) => {
  const [searchTermInput, setSearchTermInput] = useState(initialSearchTerm);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const debouncedSearchTerm = useDebounce(searchTermInput, 300);

  const [displayedCompanies, setDisplayedCompanies] = useState<Company[]>(initialCompanies);
  const [currentPage, setCurrentPage] = useState(1); // Current page of *displayed* data
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialTotalPages > 1);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Effect to update URL and trigger HomePage re-fetch on search term change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearchQueryInUrl = params.get('search') || '';
    const newSearchQueryForUrl = debouncedSearchTerm.trim();

    if (newSearchQueryForUrl) {
      params.set('search', newSearchQueryForUrl);
    } else {
      params.delete('search');
    }
    // When search term changes, always reset to page 1 (handled by HomePage)
    // No need to set 'page' param here for infinite scroll, HomePage fetches page 1.
    
    const existingPageParam = params.get('page');
    if(existingPageParam) params.delete('page'); // Remove page param for search, HomePage handles initial fetch

    if (newSearchQueryForUrl !== currentSearchQueryInUrl) {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearchTerm, pathname, router, searchParams]);

  // Effect to reset state when initialCompanies (from new search/load) or totalPages change
  useEffect(() => {
    setDisplayedCompanies(initialCompanies);
    setCurrentPage(1);
    setTotalPages(initialTotalPages);
    setHasMore(initialTotalPages > 1);
    setIsLoadingMore(false); // Reset loading state
    // Ensure scroll position is reasonable if list shrinks drastically or for new search
    if(loadMoreTriggerRef.current?.parentElement) {
       // window.scrollTo(0,0); // Option: scroll to top on new search
    }
  }, [initialCompanies, initialTotalPages, initialSearchTerm]);

  const loadMoreCompanies = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPageToFetch = currentPage + 1;
    
    try {
      const result = await fetchCompaniesAction(nextPageToFetch, itemsPerPage, debouncedSearchTerm.trim());
      if (result.error) {
        console.error("Error fetching more companies:", result.error);
        // Optionally show a toast or error message to the user
        setHasMore(false); // Stop trying to load more if there's an error
      } else {
        setDisplayedCompanies(prev => [...prev, ...result.companies]);
        setCurrentPage(nextPageToFetch);
        setHasMore(nextPageToFetch < result.totalPages);
        setTotalPages(result.totalPages); // Update totalPages from server response
      }
    } catch (e) {
        console.error("Exception fetching more companies:", e);
        setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, currentPage, itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreCompanies();
        }
      },
      { threshold: 1.0 } // Trigger when 100% of the element is visible
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
  }, [hasMore, isLoadingMore, loadMoreCompanies]);

  // Sync searchTermInput with initialSearchTerm from props (e.g., browser back/forward)
  useEffect(() => {
    setSearchTermInput(initialSearchTerm);
  }, [initialSearchTerm]);

  return (
    <div className="w-full  mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Search Input - Responsive */}
        <div className="relative w-full max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Search companies by name or description..."
            value={searchTermInput}
            onChange={(e) => setSearchTermInput(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 text-sm sm:text-base py-3 sm:py-4 lg:py-6 rounded-lg shadow-sm border-2 focus:border-primary transition-colors"
          />
        </div>

        {/* Companies Grid - Fully Responsive */}
        {displayedCompanies.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {displayedCompanies.map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          !isLoadingMore && ( // Only show "No companies" if not initially loading
            <div className="text-center py-8 sm:py-12 lg:py-16">
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                {initialSearchTerm ? 'No companies found matching your search.' : 'No companies available.'}
              </p>
            </div>
          )
        )}

        {/* Loading/End Indicator - Responsive */}
        <div 
          ref={loadMoreTriggerRef} 
          className="h-8 sm:h-10 lg:h-12 flex items-center justify-center"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
              <span className="text-sm sm:text-base text-muted-foreground hidden sm:inline">
                Loading more companies...
              </span>
            </div>
          )}
          {!isLoadingMore && !hasMore && displayedCompanies.length > 0 && (
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
              You've reached the end!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyList;