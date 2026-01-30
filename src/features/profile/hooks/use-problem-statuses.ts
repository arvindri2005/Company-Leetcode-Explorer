/**
 * @fileoverview Hook for fetching and managing problem statuses
 */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { User as FirebaseUser } from "firebase/auth";

import { getProblemByCompanySlugAndProblemSlugAction } from "@/app/actions/problem.actions";
import { useToast } from "@/shared/hooks/use-toast";
import type { LeetCodeProblem, ProblemStatus, UserProblemStatusInfo } from "@/shared/types";

interface ProblemWithDetails extends LeetCodeProblem {
  currentStatus?: ProblemStatus;
  isBookmarked?: boolean;
}

export interface ProblemStatusesData {
  problemsWithStatusDetails: ProblemWithDetails[];
  isLoadingStatuses: boolean;
  solvedProblems: ProblemWithDetails[];
  attemptedProblems: ProblemWithDetails[];
  todoProblems: ProblemWithDetails[];
  hydrateProblemsForStatus: (status: ProblemStatus) => Promise<void>;
  handleProblemStatusChange: (
    problemId: string,
    newStatus: ProblemStatus,
    companySlug?: string,
    problemSlug?: string,
  ) => void;
}

/**
 * Hook for managing problem statuses (solved, attempted, todo)
 *
 * @param user - Firebase user object
 * @param authLoading - Whether authentication is loading
 * @param problemStatuses - Map of problem statuses from useProfileData
 * @param hasFetchedStatusMap - Whether status map has been fetched
 * @param fetchStatusMap - Function to refetch status map
 * @param updateProblemStatusLocally - Function to update status locally without refetching
 * @returns ProblemStatusesData object with status data and functions
 */
export function useProblemStatuses(
  user: FirebaseUser | null,
  authLoading: boolean,
  problemStatuses: Record<string, UserProblemStatusInfo>,
  hasFetchedStatusMap: boolean,
  fetchStatusMap: () => Promise<void>,
  updateProblemStatusLocally?: (
    problemId: string,
    status: ProblemStatus,
    companySlug?: string,
    problemSlug?: string,
  ) => void,
): ProblemStatusesData {
  const { toast } = useToast();
  const [problemsWithStatusDetails, setProblemsWithStatusDetails] = useState<ProblemWithDetails[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  
  // Track which statuses we have already hydrated to prevent re-fetching
  const hydratedStatusesRef = useRef<Set<ProblemStatus>>(new Set());
  // Track which statuses are currently being fetched to prevent race conditions
  const fetchingStatusesRef = useRef<Set<ProblemStatus>>(new Set());

  // Hydrates problem details for a specific status (Solved, Attempted, etc.)
  const hydrateProblemsForStatus = useCallback(async (status: ProblemStatus) => {
    if (!user?.uid) {
      return;
    }
    
    // Wait for the map to be fetched
    if (!hasFetchedStatusMap) {
      return; 
    }

    // Prevent duplicate hydration or concurrent fetches
    if (hydratedStatusesRef.current.has(status) || fetchingStatusesRef.current.has(status)) {
      return;
    }

    fetchingStatusesRef.current.add(status);
    setIsLoadingStatuses(true);
    
    try {
      // Use current problemStatuses map to find items needing hydration
      const itemsToHydrate = Object.values(problemStatuses).filter(
        (info) => 
          info && 
          info.status === status && 
          info.companySlug && 
          info.problemSlug
      );

      // Filter out items that are ALREADY in problemsWithStatusDetails
      const existingIds = new Set(problemsWithStatusDetails.map(p => p.id));
      const uniqueItems = itemsToHydrate.filter(info => !existingIds.has(info.problemId));

      if (uniqueItems.length === 0) {
        hydratedStatusesRef.current.add(status);
        setIsLoadingStatuses(false);
        return;
      }

      const detailedProblemsPromises = uniqueItems.map(
        async (info) => {
          try {
            const result = await getProblemByCompanySlugAndProblemSlugAction(
              info.companySlug,
              info.problemSlug,
            );
            if (result.success && result.data?.problem) {
              return {
                ...result.data.problem,
                currentStatus: info.status,
              } as ProblemWithDetails;
            }
            return null;
          } catch {
            return null;
          }
        },
      );
      
      const newDetails = (await Promise.all(detailedProblemsPromises)).filter(Boolean) as ProblemWithDetails[];
      
      setProblemsWithStatusDetails(prev => [...prev, ...newDetails]);
      hydratedStatusesRef.current.add(status);

    } catch (error) {
      console.error("Failed to hydrate problems", error);
      toast({
        title: "Error",
        description: `Could not load ${status} problems details.`,
        variant: "destructive"
      });
    } finally {
      fetchingStatusesRef.current.delete(status);
      setIsLoadingStatuses(false);
    }
  }, [user, hasFetchedStatusMap, problemStatuses, problemsWithStatusDetails, toast]);

  const handleProblemStatusChange = useCallback(
    (
      problemId: string,
      newStatus: ProblemStatus,
      companySlug?: string,
      problemSlug?: string,
    ) => {
      setProblemsWithStatusDetails((prev) => {
        if (newStatus === "none") {
          return prev.filter((p) => p.id !== problemId);
        }
        return prev.map((p) =>
          p.id === problemId ? { ...p, currentStatus: newStatus } : p,
        );
      });

      if (updateProblemStatusLocally) {
        updateProblemStatusLocally(
          problemId,
          newStatus,
          companySlug,
          problemSlug,
        );
      } else {
        // Fallback to Re-fetch status map to ensure counts are accurate
        fetchStatusMap();
      }
    },
    [fetchStatusMap, updateProblemStatusLocally],
  );

  // Memoize filtered lists to prevent unnecessary re-renders
  const solvedProblems = useMemo(
    () => problemsWithStatusDetails.filter((p) => p.currentStatus === "solved"),
    [problemsWithStatusDetails]
  );

  const attemptedProblems = useMemo(
    () => problemsWithStatusDetails.filter((p) => p.currentStatus === "attempted"),
    [problemsWithStatusDetails]
  );

  const todoProblems = useMemo(
    () => problemsWithStatusDetails.filter((p) => p.currentStatus === "todo"),
    [problemsWithStatusDetails]
  );

  return {
    problemsWithStatusDetails,
    isLoadingStatuses,
    solvedProblems,
    attemptedProblems,
    todoProblems,
    hydrateProblemsForStatus,
    handleProblemStatusChange,
  };
}
