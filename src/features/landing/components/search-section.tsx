/**
 * @fileoverview Defines the search section component for the landing page.
 *
 * This client-side component provides a prominent search bar that allows users
 * to quickly find companies. It manages the state for the search input, fetches
 * autocomplete suggestions as the user types, and handles the navigation logic
 * for both direct searches and suggestion clicks.
 */
"use client";

import { useEffect, useRef,useState } from "react";

import { useRouter } from "next/navigation";

import { useDebounce } from "use-debounce";

import { fetchCompanySuggestionsAction } from "@/app/actions";
import CompanySearchBar from "@/features/companies/components/company-search-bar";
import type { Company } from "@/types";

interface Suggestion extends Pick<Company, "id" | "name" | "slug" | "logo"> {}

/**
 * Renders a search section with an interactive company search bar.
 *
 * This component serves as the stateful parent for the `CompanySearchBar`. It handles:
 * - Debouncing user input to efficiently fetch search suggestions.
 * - Calling the `fetchCompanySuggestionsAction` server action.
 * - Managing the display and lifecycle of the suggestions dropdown.
 * - Handling navigation when a user clicks a suggestion or submits a search.
 *
 * @returns {JSX.Element} The rendered search section component.
 */
export default function SearchSection() {
  const [searchTermInput, setSearchTermInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [debouncedSearchTerm] = useDebounce(searchTermInput, 300);

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
        if (Array.isArray(result)) {
          setSuggestions(result.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchTermInput(suggestion.name);
    setShowSuggestions(false);
    router.push(`/company/${suggestion.slug}`);
  };

  const handleSearch = () => {
    if (searchTermInput.trim()) {
      router.push(
        `/companies?search=${encodeURIComponent(searchTermInput.trim())}`,
      );
    }
  };

  return (
    <section className="py-20 px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl mb-4 text-gray-custom-200">Start Your Journey</h2>
        <p className="text-xl mb-8 text-gray-custom-400">
          Search for problems by name, topic, or difficulty level
        </p>
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
      </div>
    </section>
  );
}






