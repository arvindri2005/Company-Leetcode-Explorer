/**
 * @fileoverview A smart search bar component with autocomplete suggestions for companies.
 *
 * This client-side component manages its own state for the search input and suggestions.
 * It fetches company suggestions as the user types and handles user interactions.
 * It exposes an onSearch callback for when the user submits a search.
 */
"use client";

import React, { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Building2, Loader2, Search } from "lucide-react";
import { useDebounce } from "use-debounce";

import { fetchCompanySuggestionsAction } from "@/app/actions";
import { OfflineImage } from "@/components/ui/offline-image";
import { useTypingPlaceholder } from "@/features/tools/hooks/use-typing-placeholder";
import { cn, getLogoUrl } from "@/lib/utils";

/**
 * Represents the structure of a single search suggestion item.
 */
interface Suggestion {
  id: string;
  name: string;
  logo?: string;
  slug: string;
}

/**
 * Props for the CompanySearchBar component.
 */
interface SearchBarProps {
  /** The initial value for the search input. */
  initialSearchTerm?: string;
  /** Callback fired when the user submits the search (e.g., presses Enter). */
  onSearch?: (term: string) => void;
  /** Custom class name for the wrapper. */
  className?: string;
}

/**
 * Renders a smart search bar for finding companies.
 *
 * This component manages the search input state, fetches autocomplete suggestions
 * from the server, and handles navigation to company pages when a suggestion is clicked.
 * When the user submits a search (Enter key or search button), the `onSearch` callback
 * is invoked with the current search term.
 *
 * @param {SearchBarProps} props - The component props.
 * @returns {JSX.Element} The rendered search bar.
 */
const CompanySearchBar: React.FC<SearchBarProps> = ({
  initialSearchTerm = "",
  onSearch,
  className,
}) => {
  const [searchTermInput, setSearchTermInput] = useState(initialSearchTerm);
  const [debouncedSearchTerm] = useDebounce(searchTermInput, 300);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) &&
        !(
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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
          debouncedSearchTerm.trim(),
        );
        if (result.success && Array.isArray(result.data)) {
          setSuggestions(result.data.slice(0, 5));
          setShowSuggestions(true);
        } else {
            setSuggestions([]);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [debouncedSearchTerm]);

  // Handle click outside to close suggestions
  useEffect(() => {
    if (!showSuggestions) {return;}

    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  // Reset index when suggestions change
  const [prevSuggestions, setPrevSuggestions] = useState(suggestions);
  if (suggestions !== prevSuggestions) {
    setPrevSuggestions(suggestions);
    setActiveIndex(-1);
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchTermInput(suggestion.name);
    setShowSuggestions(false);
    router.push(`/company/${suggestion.slug}`);
  };

  const handleSearchSubmit = () => {
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(searchTermInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSuggestionClick(suggestions[activeIndex]);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const companies = [
    "Google",
    "Amazon",
    "Microsoft",
    "Meta",
    "Netflix",
    "Apple",
    "Uber",
    "Airbnb",
  ];
  const placeholder = useTypingPlaceholder(companies);

  return (
    <section
      className={cn("relative w-full max-w-4xl mx-auto", className)}
      aria-label="Company Search"
    >
      <div className="max-w-4xl mx-auto text-center">
        <form
          className="relative mt-8"
          role="search"
          aria-label="Search for companies"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit();
          }}
        >
          <label htmlFor="company-search-input" className="sr-only">
            Search for Companies
          </label>
          <input
            onKeyDown={handleKeyDown}
            id="company-search-input"
            name="company-search"
            type="search"
            autoComplete="off"
            role="combobox"
            inputMode="search"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="company-suggestions-list"
            aria-activedescendant={
              showSuggestions && activeIndex >= 0
                ? `suggestion-${activeIndex}`
                : undefined
            }
            ref={inputRef}
            data-testid="search-input"
            className="w-full p-5 pr-24 text-lg border border-white/10 rounded-full bg-white/5 text-white backdrop-blur-lg transition-all duration-300 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 placeholder:text-white/50"
            placeholder={`Search for ${placeholder}|`}
            value={searchTermInput}
            onChange={(e) => setSearchTermInput(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (suggestions.length > 0 || searchTermInput.trim().length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => setIsFocused(false)}
            aria-label="Search for companies"
          />
          {!isFocused && !searchTermInput && (
            <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden sm:flex pointer-events-none select-none">
              <kbd className="h-6 flex items-center gap-1 rounded border border-white/20 bg-white/5 px-2 font-mono text-[10px] font-medium text-white/50">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          )}
          <button
            type="submit"
            aria-label="Submit company search"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-brand-teal to-brand-purple border-none rounded-full w-12 h-12 text-white cursor-pointer transition-all duration-300 hover:scale-110 flex items-center justify-center"
          >
            <Search />
          </button>
        </form>
      </div>

      {isLoadingSuggestions && (
        <Loader2
          className="absolute right-3 top-3 h-5 w-5 animate-spin text-gray-400"
          aria-label="Loading suggestions"
        />
      )}

      {showSuggestions && searchTermInput.trim().length > 0 && (
        <div
          id="company-suggestions-list"
          ref={suggestionsRef}
          className="absolute z-20 mt-2 w-full rounded-2xl bg-white/10 backdrop-blur-[10px] shadow-[0_4px_32px_rgba(0,212,170,0.15)] border border-white/10 overflow-hidden animate-fade-in"
          role="listbox"
          aria-label="Company suggestions"
        >
          {(() => {
            if (isLoadingSuggestions && suggestions.length === 0) {
              return (
                <p className="p-4 text-base text-gray-custom-500">
                  Loading suggestions...
                </p>
              );
            }
            if (suggestions.length > 0) {
              return suggestions.map((suggestion, idx) => (
                <div
                  key={suggestion.id}
                  id={`suggestion-${idx}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={cn(
                    "flex items-center gap-3 px-5 py-4 cursor-pointer transition-all duration-200 text-gray-custom-200",
                    "hover:bg-gradient-to-r hover:from-brand-teal/30 hover:to-brand-purple/30 hover:text-white",
                    idx === activeIndex &&
                      "bg-gradient-to-r from-brand-teal/30 to-brand-purple/30 text-white",
                    idx !== suggestions.length - 1 &&
                      "border-b border-white/10",
                  )}
                >
                  <OfflineImage
                    src={getLogoUrl(suggestion.logo) || "/icon.png"}
                    fallbackSrc="/icon.png"
                    fallbackIcon={
                      <Building2 className="h-8 w-8 text-gray-custom-500 bg-white/10 rounded-full p-1" />
                    }
                    alt={suggestion.name}
                    width={32}
                    height={32}
                    className="rounded-full bg-white/20"
                  />
                  <span className="font-medium text-lg">{suggestion.name}</span>
                </div>
              ));
            }
            if (!isLoadingSuggestions) {
              return (
                <p className="p-4 text-base text-gray-custom-500">
                  No companies found matching &quot;{searchTermInput}&quot;.
                </p>
              );
            }
            return null;
          })()}
        </div>
      )}
    </section>
  );
};

export default CompanySearchBar;
