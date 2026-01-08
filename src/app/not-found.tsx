/**
 * @fileoverview Defines the custom 404 "Not Found" page for the application.
 *
 * This client component is automatically rendered by the Next.js App Router when a
 * requested path does not match any existing route. It provides a user-friendly
 * message, a search bar to help users find a company, and links to navigate to the
 * homepage or the main companies list.
 */
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { fetchCompanySuggestionsAction } from "@/app/actions/company.actions";
import CompanySearchBar from "@/features/companies/components/company-search-bar";
import type { Company } from "@/types";

interface Suggestion extends Pick<Company, "id" | "name" | "slug" | "logo"> {}

/**
 * Renders the 404 "Page Not Found" error page.
 *
 * This component displays a helpful message indicating that the requested page
 * could not be found. It includes an integrated company search bar that provides
 * autocomplete suggestions, allowing users to quickly search for a specific company.
 * It also offers clear navigation options to return to the homepage or browse all companies.
 *
 * @returns {JSX.Element} The rendered 404 Not Found page.
 */
export default function NotFound() {
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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
      <AlertTriangle className="h-20 w-20 text-primary mb-6" />
      <h1 className="text-4xl font-bold mb-3">Oops! Page Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
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
      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Go to Homepage
          </Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/companies">Browse Companies</Link>
        </Button>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">Error Code: 404</p>
    </div>
  );
}






