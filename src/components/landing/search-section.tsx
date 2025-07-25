'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchCompanySuggestionsAction } from '@/app/actions';
import CompnaySearchBar from '../company/compnay-search-bar';
import type { Company } from '@/types';

interface Suggestion extends Pick<Company, 'id' | 'name' | 'slug' | 'logo'> {}

export default function SearchSection() {
  const [searchTermInput, setSearchTermInput] = useState('');
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
        const result = await fetchCompanySuggestionsAction(debouncedSearchTerm.trim());
        if (Array.isArray(result)) {
          setSuggestions(result.slice(0, 5));
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchTermInput(suggestion.name);
    setShowSuggestions(false);
    router.push(`/company/${suggestion.slug}`);
  };

  const handleSearch = () => {
    if (searchTermInput.trim()) {
      router.push(`/companies?search=${encodeURIComponent(searchTermInput.trim())}`);
    }
  };

  return (
    <section className="py-20 px-8">
      <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-4xl mb-4 text-[#e4e4e7]">Start Your Journey</h2>
          <p className="text-xl mb-8 text-[#a1a1aa]">Search for problems by name, topic, or difficulty level</p>
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
        </div>
    </section>
  );
}
