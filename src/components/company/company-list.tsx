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
    <section aria-labelledby="company-list-heading" className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 id="company-list-heading" className="sr-only">Browse Companies and Their Interview Problems</h2>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search companies (e.g., Google, Amazon, Meta...)"
              value={searchTermInput}
              onChange={(e) => {
                setSearchTermInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="pl-9"
              aria-label="Search companies"
              aria-describedby="search-description"
            />
          </div>
          <p id="search-description" className="sr-only">
            Type to search for companies and their coding interview problems. Use arrow keys to navigate suggestions.
          </p>
          
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full rounded-md bg-popover shadow-md"
              role="listbox"
              aria-label="Company suggestions"
            >
              {suggestions.map((company) => (
                <button
                  key={company.id}
                  className="flex w-full items-center space-x-3 px-4 py-2 hover:bg-muted"
                  role="option"
                  onClick={() => handleSuggestionClick(company)}
                >
                  {company.logo ? (
                    <Image
                      src={company.logo}
                      alt={`${company.name} logo`}
                      width={24}
                      height={24}
                      className="rounded-sm"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span>{company.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedCompanies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreTriggerRef} className="h-10">
        {isLoadingMore && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      {!hasMore && displayedCompanies.length > 0 && (
        <p className="text-center text-muted-foreground">
          No more companies to load
        </p>
      )}

      {displayedCompanies.length === 0 && !isLoadingMore && (
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">No companies found</p>
          <p className="text-muted-foreground">
            Try adjusting your search terms or browse our full list
          </p>
        </div>
      )}
    </section>
  );
};

export default CompanyList;
