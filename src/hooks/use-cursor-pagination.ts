import { useCallback } from "react";
import type { Company } from "@/types";

interface CompaniesResponse {
    companies: Company[];
    hasMore: boolean;
    nextCursor?: string;
    error?: string;
}

export const useCursorPagination = () => {
    const fetchCompaniesWithCursor = useCallback(
        async (
            cursor?: string,
            pageSize: number = 9,
            searchTerm?: string
        ): Promise<CompaniesResponse> => {
            try {
                const response = await fetch("/api/companies", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        cursor,
                        pageSize,
                        searchTerm: searchTerm?.trim(),
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error ||
                            `HTTP error! status: ${response.status}`
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
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                };
            }
        },
        []
    );

    return { fetchCompaniesWithCursor };
};
