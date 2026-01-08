import { useState, useEffect } from 'react';
import { LeetCodeProblem } from '@/types';

// Module-level cache to persist data across tab switches (unmount/remount)
// We only cache the successful response.
const problemsCache = new Map<string, LeetCodeProblem[]>();

/**
 * Hook to fetch and cache AI problems for a company.
 *
 * This hook prevents redundant network requests when the user switches tabs
 * in the Company Page, as the AIGroupingSection is unmounted/remounted.
 */
export function useCompanyAIProblems(companyId: string) {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId) return;

    // Check cache first
    if (problemsCache.has(companyId)) {
      setProblems(problemsCache.get(companyId)!);
      return; // No need to fetch
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/companies/${companyId}/ai-problems`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch AI problems");
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          // Cache the result
          problemsCache.set(companyId, data);
          setProblems(data);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted) {
            console.error("Failed to fetch problems for AI features:", err);
            setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (isMounted) {
            setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  return { problems, isLoading, error };
}

// Helper for testing
export function clearCompanyAIProblemsCache() {
    problemsCache.clear();
}
