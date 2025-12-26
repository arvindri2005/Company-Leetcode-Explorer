import { fetchCompaniesAction } from "@/app/actions/company.actions";
import type { Company } from "@/types";
import { useCallback } from "react";

// The shape of data returned by fetchCompaniesAction
type FetchCompaniesResult = {
  companies: Company[];
  totalPages: number;
  totalCompanies: number;
  currentPage: number;
  hasMore: boolean;
  nextCursor?: string;
  error?: string;
};

interface CacheEntry {
  data: FetchCompaniesResult;
  timestamp: number;
}

// Module-level Singleton Cache (persists across unmounts/navigation)
const globalCache = new Map<string, CacheEntry>();

const MAX_CACHE_SIZE = 20;
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Helper function outside hook scope
const getCacheKey = (
  page: number,
  pageSize: number,
  searchTerm: string = "",
  cursor: string = ""
) => {
  return `${page}-${pageSize}-${searchTerm}-${cursor}`;
};

/**
 * @function useCompaniesCache
 * @description A custom hook that provides a Global, LRU-based caching layer for fetching company data.
 * The cache persists across component unmounts (navigation) but is bounded in size to prevent memory leaks.
 *
 * Flow's Improvements:
 * - Moved cache to module scope (Singleton) to persist across navigation.
 * - Implemented LRU eviction with MAX_CACHE_SIZE=20 to prevent unbounded growth ("Infinite Cache").
 * - Removed `useState` and `setInterval` to eliminate unnecessary re-renders and "Zombie Timers".
 * - Used `useCallback` to ensure stable function reference and prevent infinite loops in effects.
 *
 * @returns {{
 *   fetchCompaniesWithCache: (page: number, pageSize: number, searchTerm?: string, cursor?: string) => Promise<FetchCompaniesResult>;
 *   clearCache: () => void;
 * }}
 */
export function useCompaniesCache() {
  const fetchCompaniesWithCache = useCallback(async (
    page: number,
    pageSize: number,
    searchTerm: string = "",
    cursor: string = ""
  ): Promise<FetchCompaniesResult> => {
    const key = getCacheKey(page, pageSize, searchTerm, cursor);
    const now = Date.now();

    // 1. Check Cache
    if (globalCache.has(key)) {
      const entry = globalCache.get(key)!;

      // Check Expiry
      if (now - entry.timestamp <= CACHE_EXPIRY) {
        // LRU Update: Delete and Re-add to move to end (Most Recently Used)
        globalCache.delete(key);
        globalCache.set(key, entry);
        return entry.data;
      } else {
        // Expired
        globalCache.delete(key);
      }
    }

    // 2. Fetch from Network (Server Action)
    const data = await fetchCompaniesAction(page, pageSize, searchTerm, cursor);

    // 3. Store in Cache (if valid)
    if (data && !data.error) {
      // Enforce Max Size (LRU Policy)
      if (globalCache.size >= MAX_CACHE_SIZE) {
        // The Map iterator yields keys in insertion order.
        // The first key is the Oldest (Least Recently Used/Added).
        const oldestKey = globalCache.keys().next().value;
        if (oldestKey) {
          globalCache.delete(oldestKey);
        }
      }

      globalCache.set(key, {
        data,
        timestamp: now,
      });
    }

    return data;
  }, []); // No dependencies as it uses module-level variables

  // Utility to manually clear cache (e.g., on logout or refresh)
  const clearCache = useCallback(() => {
    globalCache.clear();
  }, []);

  return {
    fetchCompaniesWithCache,
    clearCache,
  };
}
