/**
 * @fileoverview A reusable search bar component with autocomplete suggestions for companies.
 *
 * This client-side component provides a search input field that fetches and displays
 * a list of company suggestions as the user types. It is designed to be a controlled
 * component, with its state managed by a parent component.
 */
import React, { useState, useEffect } from "react";
import { Loader2, Building2, Search } from "lucide-react";
import Image from "next/image";
import { getLogoUrl, cn } from "@/lib/utils";
import { useTypingPlaceholder } from "@/hooks/use-typing-placeholder";

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
  searchTermInput: string;
  setSearchTermInput: (value: string) => void;
  isLoadingSuggestions: boolean;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (value: boolean) => void;
  handleSuggestionClick: (suggestion: Suggestion) => void;
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
  onSearch?: () => void;
}

/**
 * Renders a search bar for finding companies, complete with autocomplete suggestions.
 *
 * This component is a controlled input that displays a dropdown of company suggestions
 * as the user types. It handles keyboard events (like "Enter" to search), click events
 * on suggestions, and the display of loading states. The actual fetching of suggestions
 * and the search action are handled by the parent component through callbacks and props.
 *
 * @param {SearchBarProps} props - The props for configuring the search bar's state and behavior.
 * @returns {JSX.Element} The rendered company search bar component.
 */
const CompanySearchBar: React.FC<SearchBarProps> = ({
  searchTermInput,
  setSearchTermInput,
  isLoadingSuggestions,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  handleSuggestionClick,
  suggestionsRef,
  onSearch,
}) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  // Use useEffect to reset index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);

  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission to allow custom onSearch
        onSearch?.();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSuggestionClick(suggestions[activeIndex]);
      } else {
        onSearch?.();
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
      className="relative w-full max-w-[800px] mx-auto"
      aria-label="Company Search"
    >
      <div className="max-w-[800px] mx-auto text-center">
        <form
          className="relative mt-8"
          role="search"
          aria-label="Search for companies"
          onSubmit={(e) => {
            e.preventDefault();
            // onSearch is handled by onKeyDown for Enter, but if triggered by other means:
            onSearch?.();
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
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="company-suggestions-list"
            aria-activedescendant={
              showSuggestions && activeIndex >= 0
                ? `suggestion-${activeIndex}`
                : undefined
            }
            data-testid="search-input"
            className="w-full p-5 text-lg border border-white/10 rounded-full bg-white/5 text-white backdrop-blur-lg transition-all duration-300 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 placeholder:text-white/50"
            placeholder={`Search for ${placeholder}|`}
            value={searchTermInput}
            onChange={(e) => setSearchTermInput(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 || searchTermInput.trim().length > 0)
                setShowSuggestions(true);
            }}
            aria-label="Search for companies"
          />
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
          {isLoadingSuggestions && suggestions.length === 0 ? (
            <p className="p-4 text-base text-gray-custom-500">
              Loading suggestions...
            </p>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, idx) => (
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
                  idx !== suggestions.length - 1 && "border-b border-white/10",
                )}
              >
                {suggestion.logo ? (
                  <Image
                    src={getLogoUrl(suggestion.logo) as string}
                    alt={suggestion.name}
                    width={32}
                    height={32}
                    className="rounded-full bg-white/20"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-gray-custom-500 bg-white/10 rounded-full p-1" />
                )}
                <span className="font-medium text-lg">{suggestion.name}</span>
              </div>
            ))
          ) : (
            !isLoadingSuggestions && (
              <p className="p-4 text-base text-gray-custom-500">
                No companies found matching &quot;{searchTermInput}&quot;.
              </p>
            )
          )}
        </div>
      )}
    </section>
  );
};

export default CompanySearchBar;
