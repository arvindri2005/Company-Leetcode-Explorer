"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { useTypingPlaceholder } from "@/hooks/use-typing-placeholder";

export function DashboardHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

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

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    params.delete("page"); // Reset to page 1 on search (default behavior)
    router.replace(`/companies?${params.toString()}`);
  }, 300);

  return (
    <div className="relative py-12 sm:py-20 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
          Explore Companies & Their Interview Problems
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover and prepare with real questions from top tech companies.
        </p>
      </div>

      <div className="max-w-2xl mx-auto relative">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full opacity-30 group-hover:opacity-50 blur transition duration-200"></div>
          <div className="relative flex items-center bg-brand-surface rounded-full border border-white/10 shadow-xl">
            <Input
              type="text"
              placeholder={`Search for ${placeholder}|`}
              className="w-full bg-transparent border-none text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 py-6 pl-6 pr-14 rounded-full text-lg"
              defaultValue={initialSearch}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className="absolute right-2 p-2 bg-teal-500 rounded-full text-white">
              <Search className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
