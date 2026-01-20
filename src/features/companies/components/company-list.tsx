/**
 * @fileoverview A client-side component for displaying an interactive and paginated list of companies.
 *
 * This component is responsible for rendering the main list of companies on the `/companies`
 * page. It receives an initial set of data from the server and then handles all
 * client-side interactions, including infinite scrolling to load more companies,
 * a debounced search with autocomplete suggestions, and updating the URL.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import ErrorBoundary from "@/components/ui/error-boundary";
import type { Company } from "@/features/companies/types";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";

import CompanyCard from "./company-card";
import CompanyCardErrorFallback from "./company-card-error-fallback";
import CompanySearchBar from "./company-search-bar";

/**
 * Props for the CompanyList component.
 */
interface CompanyListProps {
  /** The initial array of companies to display, fetched on the server. */
  initialCompanies: Company[];
  /** The initial search term from the URL search parameters. */
  initialSearchTerm?: string;
  /** A boolean indicating if more companies can be loaded. */
  initialHasMore: boolean;
  /** The cursor to use for fetching the next page of companies. */
  initialNextCursor?: string;
  /** The number of items to fetch per page for pagination. */
  itemsPerPage: number;
}

/**
 * Renders an interactive, searchable, and infinitely scrolling list of companies.
 *
 * This component takes an initial list of companies from its props (server-rendered)
 * and then manages subsequent data fetching on the client. Key features include:
 * - **Infinite Scroll:** Uses an `IntersectionObserver` to automatically fetch and
 *   append the next page of companies when the user scrolls to the bottom.
 * - **Search with Autocomplete:** Includes a search bar that fetches company
 *   suggestions as the user types (debounced) and allows submitting a search to
 *   filter the company list, updating the URL accordingly.
 * - **State Management:** Manages the list of displayed companies, loading states,
 *   pagination cursors, and search suggestions.
 *
 * @param {CompanyListProps} props - The props for the component.
 * @returns {JSX.Element} The rendered list of companies with search and pagination functionality.
 */
const CompanyList: React.FC<CompanyListProps> = ({
  initialCompanies,
  initialSearchTerm = "",
  initialHasMore,
  initialNextCursor,
  itemsPerPage,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [displayedCompanies, setDisplayedCompanies] =
    useState<Company[]>(initialCompanies);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(
    initialNextCursor,
  );

  const { fetchCompaniesWithCursor } = useCursorPagination();
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Reset displayed companies when initial data changes
  useEffect(() => {
    setDisplayedCompanies(initialCompanies);
    setHasMore(initialHasMore);
    setNextCursor(initialNextCursor);
    setIsLoadingMore(false);
  }, [initialCompanies, initialHasMore, initialNextCursor]);

  // Handle search
  const handleSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term.trim()) {
        params.set("search", term.trim());
      } else {
        params.delete("search");
      }
      // Reset page to 1 on new search
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const loadMoreCompanies = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) {
      return;
    }
    setIsLoadingMore(true);
    const currentSearchQueryInUrl = searchParams.get("search") || "";
    try {
      const result = await fetchCompaniesWithCursor(
        nextCursor,
        itemsPerPage,
        currentSearchQueryInUrl,
      );
      setDisplayedCompanies((prev) => {
        // Optimization: Create Set directly from loop to avoid intermediate array allocation
        const existingIds = new Set<string>();
        for (const c of prev) {
          existingIds.add(c.id);
        }

        const newCompanies = (result.companies as Company[]).filter(
          (c: Company) => !existingIds.has(c.id),
        );
        
        if (newCompanies.length === 0) {
          return prev;
        }

        return [...prev, ...newCompanies];
      });
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    nextCursor,
    itemsPerPage,
    searchParams,
    fetchCompaniesWithCursor,
  ]);

  // Keep a ref to the latest loadMore callback to avoid re-creating the observer
  const loadMoreCompaniesRef = useRef(loadMoreCompanies);
  useEffect(() => {
    loadMoreCompaniesRef.current = loadMoreCompanies;
  }, [loadMoreCompanies]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreCompaniesRef.current();
        }
      },
      { threshold: 0.1, rootMargin: "500px" },
    );
    
    const trigger = loadMoreTriggerRef.current;
    if (trigger) {
      observer.observe(trigger);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []); // Stable observer

  return (
    <section
      className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8"
      aria-label="Company List"
    >
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <CompanySearchBar
          initialSearchTerm={initialSearchTerm}
          onSearch={handleSearch}
        />
        {displayedCompanies.length > 0 ? (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
            aria-label="Company Cards"
          >
            {displayedCompanies.map((company, index) => (
              <li key={company.id} className="list-none">
                <ErrorBoundary fallback={<CompanyCardErrorFallback />}>
                  <CompanyCard company={company} priority={index < 8} />
                </ErrorBoundary>
              </li>
            ))}
          </ul>
        ) : (
          !isLoadingMore && (
            <div className="text-center py-8 sm:py-12 lg:py-16">
              <h2 className="text-lg font-semibold mb-2">No Results</h2>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                {initialSearchTerm
                  ? "No companies found matching your search."
                  : "No companies available."}
              </p>
            </div>
          )
        )}
        <div
          ref={loadMoreTriggerRef}
          className="h-8 sm:h-10 lg:h-12 flex items-center justify-center"
          aria-live="polite"
        >
          {isLoadingMore && (
            <span
              className="text-sm sm:text-base text-muted-foreground"
              aria-busy="true"
            >
              Loading more companies...
            </span>
          )}
          {!isLoadingMore && !hasMore && displayedCompanies.length > 0 && (
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
              You&apos;ve reached the end!
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CompanyList;
