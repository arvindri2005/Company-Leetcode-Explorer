"use client";

import React, { useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { Input } from "@/components/ui/input";
import { useTypingPlaceholder } from "@/features/tools/hooks/use-typing-placeholder";

const COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Netflix",
  "Apple",
  "Uber",
  "Airbnb",
];

export function DashboardSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const placeholder = useTypingPlaceholder(COMPANIES);

  const debouncedSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    params.delete("page"); // Reset to page 1 on search
    router.replace(`/companies?${params.toString()}`);
  }, 300);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full opacity-30 group-hover:opacity-50 blur transition duration-200"></div>
      <div className="relative flex items-center bg-brand-surface rounded-full border border-white/10 shadow-xl">
        <Input
          ref={inputRef}
          type="text"
          placeholder={`Search for ${placeholder}|`}
          className="w-full bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 py-6 pl-6 pr-24 rounded-full text-lg"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              handleInputChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-14 text-white/50 hover:text-white transition-colors p-2"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="absolute right-2 p-2 bg-teal-500 rounded-full text-white">
          <Search className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
