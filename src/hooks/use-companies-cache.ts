import { useState, useEffect } from "react";
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

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

export function useCompaniesCache() {
    const [cache, setCache] = useState<CompaniesCache>({});

    // Clear expired cache entries
    useEffect(() => {
        const clearExpiredCache = () => {
            const now = Date.now();
            const newCache = { ...cache };
            let hasChanges = false;

            Object.keys(newCache).forEach((key) => {
                if (now - newCache[key].timestamp > CACHE_EXPIRY) {
                    delete newCache[key];
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                setCache(newCache);
            }
        };

        // Run cleanup every minute
        const interval = setInterval(clearExpiredCache, 60 * 1000);
        return () => clearInterval(interval);
    }, [cache]);

    const getCacheKey = (
        page: number,
        pageSize: number,
        searchTerm: string = ""
    ) => {
        return `${page}-${pageSize}-${searchTerm}`;
    };

    const getCachedData = (
        page: number,
        pageSize: number,
        searchTerm: string = ""
    ) => {
        const key = getCacheKey(page, pageSize, searchTerm);
        const cacheEntry = cache[key];

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
        }
    ) => {
        const key = getCacheKey(page, pageSize, searchTerm);
        setCache((prev) => ({
            ...prev,
            [key]: {
                data,
                timestamp: Date.now(),
            },
        }));
    };

    const fetchCompaniesWithCache = async (
        page: number,
        pageSize: number,
        searchTerm: string = ""
    ) => {
        // Try to get from cache first
        const cachedData = getCachedData(page, pageSize, searchTerm);
        if (cachedData) {
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
        clearCache: () => setCache({}),
    };
}
