'use client';

import type { Company } from '@/types';
import { useState, useEffect, useRef, useCallback } from 'react';
import CompanyCard from './company-card';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Building2 } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchCompanySuggestionsAction } from '@/app/actions';
import Image from 'next/image';
import CompannySearchBar from './compnay-search-bar';

interface Suggestion extends Pick<Company, 'id' | 'name' | 'slug' | 'logo'> {}

interface CompanyListProps {
  initialCompanies: Company[];
  initialSearchTerm?: string;
  initialHasMore: boolean;
  initialNextCursor?: string;
  itemsPerPage: number;
}

// Custom hook for cursor-based companies fetching
const useCursorPagination = () => {
  const fetchCompaniesWithCursor = useCallback(async (
    cursor?: string, 
    pageSize: number = 9, 
    searchTerm?: string
  ) => {
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cursor,
          pageSize,
          searchTerm: searchTerm?.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching companies:', error);
      return { 
        companies: [], 
        hasMore: false, 
        nextCursor: undefined,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  return { fetchCompaniesWithCursor };
};

const CompanyList: React.FC<CompanyListProps> = ({ 
  initialCompanies, 
  initialSearchTerm = '',
  initialHasMore,
  initialNextCursor,
  itemsPerPage,
}) => {
  const [searchTermInput, setSearchTermInput] = useState(initialSearchTerm);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debouncedSearchTerm = useDebounce(searchTermInput, 300);
  
  // Cursor-based pagination state
  const [displayedCompanies, setDisplayedCompanies] = useState<Company[]>(initialCompanies);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  
  // Search suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Refs
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  
  // Custom hook for fetching
  const { fetchCompaniesWithCursor } = useCursorPagination();

  // Effect to reset displayed companies when initial data changes (due to search/navigation)
  useEffect(() => {
    setDisplayedCompanies(initialCompanies);
    setHasMore(initialHasMore);
    setNextCursor(initialNextCursor);
    setIsLoadingMore(false);
  }, [initialCompanies, initialHasMore, initialNextCursor]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchTermInput(suggestion.name);
    setShowSuggestions(false);
    router.push(`/company/${suggestion.slug}`); 
  };

  const loadMoreCompanies = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;

    setIsLoadingMore(true);
    const currentSearchQueryInUrl = searchParams.get('search') || '';

    try {
      const result = await fetchCompaniesWithCursor(
        nextCursor, 
        itemsPerPage, 
        currentSearchQueryInUrl
      );
      
      if ('error' in result && result.error) {
        console.error("Error fetching more companies:", result.error);
        setHasMore(false);
      } else {
        // Append new companies to existing ones, ensuring uniqueness by id
        setDisplayedCompanies(prev => {
          const existingIds = new Set(prev.map((c: Company) => c.id));
          const newCompanies = (result.companies as Company[]).filter((c: Company) => !existingIds.has(c.id));
          return [...prev, ...newCompanies];
        });
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      }
    } catch (e) {
      console.error("Exception fetching more companies:", e);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, nextCursor, itemsPerPage, searchParams, fetchCompaniesWithCursor]);

  useEffect(() => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (debouncedSearchTerm) {
      current.set('search', debouncedSearchTerm);
    } else {
      current.delete('search');
    }
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`, { scroll: false });
  }, [debouncedSearchTerm, pathname, router, searchParams]);

  // Effect for fetching suggestions when search input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const result = await fetchCompanySuggestionsAction(debouncedSearchTerm.trim());
        if (Array.isArray(result)) {
          setSuggestions(result.slice(0, 5)); // Limit to top 5 suggestions
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

  // Effect for infinite scroll using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreCompanies();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreCompanies]);

  // Click outside handler for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Search Input and Suggestions Container */}
        <CompannySearchBar
          searchTermInput={searchTermInput}
          setSearchTermInput={setSearchTermInput}
          isLoadingSuggestions={isLoadingSuggestions}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          handleSuggestionClick={handleSuggestionClick}
          suggestionsRef={suggestionsRef}
        />

        {/* Companies Grid - Fully Responsive */}
        {displayedCompanies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {displayedCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          !isLoadingMore && ( 
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