'use client';

import type { Company } from '@/types';
import { useState, useEffect, useRef, useCallback } from 'react';
import CompanyCard from './company-card';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Building2 } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useCompaniesCache } from '@/hooks/use-companies-cache';
import { fetchCompanySuggestionsAction } from '@/app/actions';
import Image from 'next/image';

interface Suggestion extends Pick<Company, 'id' | 'name' | 'slug' | 'logo'> {}

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialTotalPages > 1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const { fetchCompaniesWithCache } = useCompaniesCache();

  // Effect to reset displayed companies and pagination when initialCompanies or initialTotalPages change.
  useEffect(() => {
    setDisplayedCompanies(initialCompanies);
    setCurrentPage(1);
    setTotalPages(initialTotalPages);
    setHasMore(initialTotalPages > 1);
    setIsLoadingMore(false);
  }, [initialCompanies, initialTotalPages]);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchTermInput(suggestion.name);
    setShowSuggestions(false);
    
    const params = new URLSearchParams(searchParams.toString());
    if (suggestion.name.trim()) {
      params.set('search', suggestion.name.trim());
    } else {
      params.delete('search');
    }
    if(params.has('page')) params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const loadMoreCompanies = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPageToFetch = currentPage + 1;
    const currentSearchQueryInUrl = searchParams.get('search') || '';

    try {
      const result = await fetchCompaniesWithCache(nextPageToFetch, itemsPerPage, currentSearchQueryInUrl);
      if ('error' in result) {
        console.error("Error fetching more companies:", result.error);
        setHasMore(false);
      } else {
        setDisplayedCompanies(prev => [...prev, ...result.companies]);
        setCurrentPage(prev => prev + 1);
        setHasMore(nextPageToFetch < result.totalPages);
        setTotalPages(result.totalPages);
      }
    } catch (e) {
      console.error("Exception fetching more companies:", e);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, itemsPerPage, searchParams, fetchCompaniesWithCache]);

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

  // Effect for updating route based on search term
  useEffect(() => {
    if (debouncedSearchTerm === initialSearchTerm) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm.trim()) {
      params.set('search', debouncedSearchTerm.trim());
    } else {
      params.delete('search');
    }
    if(params.has('page')) params.delete('page');
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [debouncedSearchTerm, router, pathname, searchParams, initialSearchTerm]);

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
        <div className="relative w-full max-w-2xl mx-auto" ref={suggestionsRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder="Search companies by name..."
              value={searchTermInput}
              onChange={(e) => setSearchTermInput(e.target.value)}
              onFocus={() => { if (suggestions.length > 0 || searchTermInput.trim().length > 0) setShowSuggestions(true);}}
              className="w-full pl-9 sm:pl-10 pr-4 text-sm sm:text-base py-3 sm:py-4 lg:py-6 rounded-lg shadow-sm border-2 focus:border-primary transition-colors"
            />
            {isLoadingSuggestions && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {showSuggestions && searchTermInput.trim().length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isLoadingSuggestions && suggestions.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">Loading suggestions...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-center px-3 py-2.5 hover:bg-accent cursor-pointer text-sm"
                    onMouseDown={(e) => { // Use onMouseDown to fire before input's onBlur
                      e.preventDefault(); // Prevent input blur
                      handleSuggestionClick(suggestion);
                    }}
                  >
                    {suggestion.logo ? (
                      <Image 
                        src={suggestion.logo} 
                        alt={`${suggestion.name} logo`} 
                        width={24} 
                        height={24} 
                        className="h-6 w-6 rounded-sm mr-2.5 object-contain border"
                        data-ai-hint={`${suggestion.name} logo`}
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-sm mr-2.5 bg-muted flex items-center justify-center border">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    {suggestion.name}
                  </div>
                ))
              ) : (
                !isLoadingSuggestions && <div className="p-3 text-center text-sm text-muted-foreground">No companies found matching "{searchTermInput}".</div>
              )}
            </div>
          )}
        </div>

        {/* Companies Grid - Fully Responsive */}
        {displayedCompanies.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {displayedCompanies.map(company => (
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
