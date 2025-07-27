"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchCompanySuggestionsAction } from "@/app/actions";
import CompnaySearchBar from "@/components/company/compnay-search-bar";
import type { Company } from "@/types";

interface Suggestion extends Pick<Company, "id" | "name" | "slug" | "logo"> {}

export default function NotFound() {
    const [searchTermInput, setSearchTermInput] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const debouncedSearchTerm = useDebounce(searchTermInput, 300);

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
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSuggestionClick = (suggestion: Suggestion) => {
        setSearchTermInput(suggestion.name);
        setShowSuggestions(false);
        router.push(`/company/${suggestion.slug}`);
    };

    const handleSearch = () => {
        if (searchTermInput.trim()) {
            router.push(
                `/companies?search=${encodeURIComponent(
                    searchTermInput.trim()
                )}`
            );
        }
    };
    return (
        <div className="bg-background flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
            <AlertTriangle className="h-20 w-20 text-primary mb-6" />
            <h1 className="text-4xl font-bold mb-3">Oops! Page Not Found</h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-md">
                The page you&apos;re looking for doesn&apos;t exist or has been
                moved.
            </p>

            <CompnaySearchBar
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
                <Button
                    asChild
                    variant="outline"
                    size="lg"
                >
                    <Link href="/">
                        <Home className="mr-2 h-5 w-5" />
                        Go to Homepage
                    </Link>
                </Button>
                <Button
                    asChild
                    size="lg"
                >
                    <Link href="/companies">Browse Companies</Link>
                </Button>
            </div>
            <p className="mt-12 text-sm text-muted-foreground">
                Error Code: 404
            </p>
        </div>
    );
}
