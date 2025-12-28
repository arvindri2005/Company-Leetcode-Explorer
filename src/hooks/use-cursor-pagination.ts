import { useCallback, useEffect, useRef } from "react";
import type { Company } from "@/types";
import { Logger } from "@/lib/logger";

interface CompaniesResponse {
  companies: Company[];
  hasMore: boolean;
  nextCursor?: string;
  error?: string;
}

/**
 * @function useCursorPagination
 * @description A custom hook that provides a function for fetching paginated company data using a cursor-based approach.
 * This is primarily used for infinite scrolling features. It includes cleanup logic to abort pending requests on unmount.
 * @returns {{
 *   fetchCompaniesWithCursor: (cursor?: string, pageSize?: number, searchTerm?: string) => Promise<CompaniesResponse>;
 * }} An object containing the `fetchCompaniesWithCursor` function.
 */
export const useCursorPagination = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchCompaniesWithCursor = useCallback(
    async (
      cursor?: string,
      pageSize: number = 9,
      searchTerm?: string,
    ): Promise<CompaniesResponse> => {
      // Abort any pending request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const params = new URLSearchParams();
        if (cursor) params.append("cursor", cursor);
        if (pageSize) params.append("pageSize", pageSize.toString());
        if (searchTerm?.trim()) params.append("searchTerm", searchTerm.trim());

        const response = await fetch(`/api/companies?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`,
          );
        }

        const result = await response.json();
        return result;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          // Return a neutral response for aborted requests
          return {
            companies: [],
            hasMore: false, // or keep previous state logic in consumer
          };
        }
        
        Logger.error("Error fetching companies", error);
        
        return {
          companies: [],
          hasMore: false,
          nextCursor: undefined,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [],
  );

  return { fetchCompaniesWithCursor };
};
