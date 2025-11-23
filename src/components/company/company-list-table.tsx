"use client";

import type { Company } from "@/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { CompanyTable } from "./company-table";
import { useSearchParams } from "next/navigation";

interface CompanyListTableProps {
  initialCompanies: Company[];
  initialHasMore: boolean;
  initialNextCursor?: string;
  itemsPerPage: number;
}

export function CompanyListTable({
  initialCompanies,
  initialHasMore,
  initialNextCursor,
  itemsPerPage,
}: CompanyListTableProps) {
  const searchParams = useSearchParams();
  const [displayedCompanies, setDisplayedCompanies] =
    useState<Company[]>(initialCompanies);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(
    initialNextCursor,
  );
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Reset displayed companies when initial data changes (e.g. search)
  useEffect(() => {
    setDisplayedCompanies(initialCompanies);
    setHasMore(initialHasMore);
    setNextCursor(initialNextCursor);
    setIsLoadingMore(false);
  }, [initialCompanies, initialHasMore, initialNextCursor]);

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
    [],
  );

  const loadMoreCompanies = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return;
    setIsLoadingMore(true);
    const currentSearchQueryInUrl = searchParams.get("search") || "";
    try {
      const result = await fetchCompaniesWithCursor(
        nextCursor,
        itemsPerPage,
        currentSearchQueryInUrl,
      );
      setDisplayedCompanies((prev) => {
        const existingIds = new Set(prev.map((c: Company) => c.id));
        const newCompanies = (result.companies as Company[]).filter(
          (c: Company) => !existingIds.has(c.id),
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

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreCompanies();
      },
      { threshold: 0.1, rootMargin: "500px" },
    );
    if (loadMoreTriggerRef.current)
      observer.observe(loadMoreTriggerRef.current);
    return () => observer.disconnect();
  }, [loadMoreCompanies]);

  return (
    <div className="space-y-8">
      {displayedCompanies.length > 0 ? (
        <CompanyTable companies={displayedCompanies} />
      ) : (
        !isLoadingMore && (
          <div className="text-center py-12">
            <h2 className="text-lg font-semibold text-white mb-2">No Results</h2>
            <p className="text-gray-400">
              No companies found matching your search.
            </p>
          </div>
        )
      )}
      
      <div
        ref={loadMoreTriggerRef}
        className="h-12 flex items-center justify-center"
      >
        {isLoadingMore && (
          <span className="text-gray-400">Loading more companies...</span>
        )}
        {!isLoadingMore && !hasMore && displayedCompanies.length > 0 && (
          <p className="text-gray-500 text-sm">You&apos;ve reached the end!</p>
        )}
      </div>
    </div>
  );
}
