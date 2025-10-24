/**
 * @fileoverview A client-side component for displaying an interactive and paginated list of companies.
 *
 * This component is responsible for rendering the main list of companies on the `/companies`
 * page. It receives an initial set of data from the server and then handles all
 * client-side interactions, including infinite scrolling to load more companies,
 * a debounced search with autocomplete suggestions, and updating the URL.
 */
"use client";

import type { Company } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import CompanyCard from "./company-card";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchCompanySuggestionsAction } from "@/app/actions";
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
    /** The current page number, used for pagination state. */
    currentPage: number;
    /** The total number of pages available. */
    totalPages: number;
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
    currentPage,
    totalPages,
}) => {
    const [searchTermInput, setSearchTermInput] = useState(initialSearchTerm);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const debouncedSearchTerm = useDebounce(searchTermInput, 300);
    const [displayedCompanies, setDisplayedCompanies] =
        useState<Company[]>(initialCompanies);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [nextCursor, setNextCursor] = useState<string | undefined>(
        initialNextCursor
    );


    interface Suggestion
        extends Pick<Company, "id" | "name" | "slug" | "logo"> {}
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

    // Reset displayed companies when initial data changes
    useEffect(() => {
        setDisplayedCompanies(initialCompanies);
        setHasMore(initialHasMore);
        setNextCursor(initialNextCursor);
        setIsLoadingMore(false);
    }, [initialCompanies, initialHasMore, initialNextCursor]);

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: any) => {
        setSearchTermInput(suggestion.name);
        setShowSuggestions(false);
        router.push(`/company/${suggestion.slug}`);
    };

    // Handle search
    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTermInput.trim()) {
            params.set("search", searchTermInput.trim());
        } else {
            params.delete("search");
        }
        // Reset page to 1 on new search
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    };

    // Load more companies
    const fetchCompaniesWithCursor = useCallback(
        async (cursor?: string, pageSize: number = 9, searchTerm?: string) => {
            try {
                const response = await fetch("/api/companies", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cursor,
                        pageSize,
                        searchTerm: searchTerm?.trim(),
                    }),
                });
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                return { companies: [], hasMore: false, nextCursor: undefined };
            }
        },
        []
    );

    const loadMoreCompanies = useCallback(async () => {
        if (isLoadingMore || !hasMore || !nextCursor) return;
        setIsLoadingMore(true);
        const currentSearchQueryInUrl = searchParams.get("search") || "";
        try {
            const result = await fetchCompaniesWithCursor(
                nextCursor,
                itemsPerPage,
                currentSearchQueryInUrl
            );
            setDisplayedCompanies((prev) => {
                const existingIds = new Set(prev.map((c: Company) => c.id));
                const newCompanies = (result.companies as Company[]).filter(
                    (c: Company) => !existingIds.has(c.id)
                );
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

    // Fetch suggestions when search input changes
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedSearchTerm.trim().length < 2) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }
            setIsLoadingSuggestions(true);
            try {
                const result = await fetchCompanySuggestionsAction(
                    debouncedSearchTerm.trim()
                );
                if (Array.isArray(result)) {
                    setSuggestions(result.slice(0, 5));
                    setShowSuggestions(true);
                }
            } finally {
                setIsLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, [debouncedSearchTerm]);

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMoreCompanies();
            },
            { threshold: 0.1 }
        );
        if (loadMoreTriggerRef.current)
            observer.observe(loadMoreTriggerRef.current);
        return () => observer.disconnect();
    }, [loadMoreCompanies]);

    // Click outside suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <section
            className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8"
            aria-label="Company List"
        >
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <CompanySearchBar
                    searchTermInput={searchTermInput}
                    setSearchTermInput={setSearchTermInput}
                    isLoadingSuggestions={isLoadingSuggestions}
                    suggestions={suggestions}
                    showSuggestions={showSuggestions}
                    setShowSuggestions={setShowSuggestions}
                    handleSuggestionClick={handleSuggestionClick}
                    suggestionsRef={suggestionsRef}
                    onSearch={handleSearch}
                />
                {displayedCompanies.length > 0 ? (
                    <ul
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
                        aria-label="Company Cards"
                    >
                        {displayedCompanies.map((company) => (
                            <li
                                key={company.id}
                                className="list-none"
                            >
                                <CompanyCard company={company} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    !isLoadingMore && (
                        <div className="text-center py-8 sm:py-12 lg:py-16">
                            <h2 className="text-lg font-semibold mb-2">
                                No Results
                            </h2>
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
                    {!isLoadingMore &&
                        !hasMore &&
                        displayedCompanies.length > 0 && (
                            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                                You've reached the end!
                            </p>
                        )}
                </div>
            </div>
        </section>
    );
};

export default CompanyList;