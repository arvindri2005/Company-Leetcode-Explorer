import { useCallback, useEffect, useRef } from "react";
import type { Company } from "@/types";

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
          const errorData: unknown = await response.json();
          const errorMessage =
            typeof errorData === "object" &&
            errorData !== null &&
            "error" in errorData &&
            typeof (errorData as { error: unknown }).error === "string"
              ? (errorData as { error: string }).error
              : `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }

        const result = (await response.json()) as CompaniesResponse;
        return result;
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          // Return a neutral response for aborted requests
          return {
            companies: [],
            hasMore: false, // or keep previous state logic in consumer
          };
        }
        console.error("Error fetching companies:", error);
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
