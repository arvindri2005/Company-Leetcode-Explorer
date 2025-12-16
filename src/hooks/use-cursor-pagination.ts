import { useCallback } from "react";
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
 * This is primarily used for infinite scrolling features.
 * @returns {{
 *   fetchCompaniesWithCursor: (cursor?: string, pageSize?: number, searchTerm?: string) => Promise<CompaniesResponse>;
 * }} An object containing the `fetchCompaniesWithCursor` function.
 */
export const useCursorPagination = () => {
  const fetchCompaniesWithCursor = useCallback(
    async (
      cursor?: string,
      pageSize: number = 9,
      searchTerm?: string,
    ): Promise<CompaniesResponse> => {
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
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`,
          );
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error fetching companies:", error);
        return {
          companies: [],
          hasMore: false,
          nextCursor: undefined,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [],
  );

  return { fetchCompaniesWithCursor };
};
