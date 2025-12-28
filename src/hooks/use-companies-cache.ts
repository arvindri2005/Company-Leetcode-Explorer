import type { Company } from "@/types";
import { fetchCompaniesAction } from "@/app/actions/company.actions";

// Cache structure
interface CompaniesCache {
  [key: string]: {
    data: {
      companies: Company[];
      totalPages: number;
      totalCompanies: number;
      currentPage: number;
    };
    timestamp: number;
  };
}

// Global cache storage (Singleton)
let globalCache: CompaniesCache = {};
let cleanupIntervalId: NodeJS.Timeout | null = null;

// Cache expiry time (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000;
// Cleanup interval (10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000;

/**
 * @function useCompaniesCache
 * @description A custom hook that provides a caching layer for fetching company data.
 * It uses a module-level singleton cache to persist data across component remounts (navigation),
 * ensuring efficient memory usage and reduced network requests.
 * @returns {{
 *   fetchCompaniesWithCache: (page: number, pageSize: number, searchTerm?: string) => Promise<{
 *     companies: Company[];
 *     totalPages: number;
 *     totalCompanies: number;
 *     currentPage: number;
 *   } | { error: string; }>;
 *   clearCache: () => void;
 * }} An object containing the cached fetch function and a function to clear the cache.
 */
export function useCompaniesCache() {
  // Initialize cleanup interval if not running
  if (!cleanupIntervalId && typeof window !== "undefined") {
    const clearExpiredCache = () => {
      const now = Date.now();
      let hasChanges = false;

      Object.keys(globalCache).forEach((key) => {
        if (now - globalCache[key].timestamp > CACHE_EXPIRY) {
          delete globalCache[key];
          hasChanges = true;
        }
      });
      
      // Optional: Log if cache was cleaned
      if (hasChanges && process.env.NODE_ENV === 'development') {
        console.debug("🗑️ [Flow] Companies cache cleaned");
      }
    };

    cleanupIntervalId = setInterval(clearExpiredCache, CLEANUP_INTERVAL);
  }

  const getCacheKey = (
    page: number,
    pageSize: number,
    searchTerm: string = "",
  ) => {
    return `${page}-${pageSize}-${searchTerm}`;
  };

  const getCachedData = (
    page: number,
    pageSize: number,
    searchTerm: string = "",
  ) => {
    const key = getCacheKey(page, pageSize, searchTerm);
    const cacheEntry = globalCache[key];

    if (cacheEntry && Date.now() - cacheEntry.timestamp <= CACHE_EXPIRY) {
      return cacheEntry.data;
    }

    return null;
  };

  const setCachedData = (
    page: number,
    pageSize: number,
    searchTerm: string = "",
    data: {
      companies: Company[];
      totalPages: number;
      totalCompanies: number;
      currentPage: number;
    },
  ) => {
    const key = getCacheKey(page, pageSize, searchTerm);
    globalCache[key] = {
      data,
      timestamp: Date.now(),
    };
  };

  const fetchCompaniesWithCache = async (
    page: number,
    pageSize: number,
    searchTerm: string = "",
  ) => {
    // Try to get from cache first
    const cachedData = getCachedData(page, pageSize, searchTerm);
    if (cachedData) {
      if (process.env.NODE_ENV === 'development') {
        console.debug("⚡ [Flow] Cache hit for companies", { page, searchTerm });
      }
      return cachedData;
    }

    // If not in cache, fetch from API
    const data = await fetchCompaniesAction(page, pageSize, searchTerm);
    if (!("error" in data)) {
      setCachedData(page, pageSize, searchTerm, data);
    }
    return data;
  };

  return {
    fetchCompaniesWithCache,
    clearCache: () => {
      globalCache = {};
    },
  };
}
