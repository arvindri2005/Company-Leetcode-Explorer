/**
 * @fileoverview Hook for fetching and managing profile data
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { User as FirebaseUser } from "firebase/auth";

import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/hooks/use-toast";
import type { ProblemStatus,UserProblemStatusInfo } from "@/types";

export interface ProfileData {
  problemStatuses: Record<string, UserProblemStatusInfo>;
  hasFetchedStatusMap: boolean;
  isLoadingStatuses: boolean;
  stats: {
    solved: number;
    attempted: number;
    todo: number;
  };
  fetchStatusMap: () => Promise<void>;
  hydrateProblemsForStatus: (status: ProblemStatus) => Promise<void>;
  updateProblemStatusLocally: (
    problemId: string,
    status: ProblemStatus,
    companySlug?: string,
    problemSlug?: string
  ) => void;
}

/**
 * Hook for managing profile data including problem statuses and statistics
 * 
 * @param user - Firebase user object
 * @param authLoading - Whether authentication is loading
 * @returns ProfileData object with status data and fetch functions
 */
export function useProfileData(
  user: FirebaseUser | null,
  authLoading: boolean
): ProfileData {
  const { toast } = useToast();
  const [problemStatuses, setProblemStatuses] = useState<Record<string, UserProblemStatusInfo>>({});
  const [hasFetchedStatusMap, setHasFetchedStatusMap] = useState(false);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  
  // Track which statuses we have already hydrated to prevent re-fetching
  const hydratedStatusesRef = useRef<Set<ProblemStatus>>(new Set());
  // Track which statuses are currently being fetched to prevent race conditions
  const fetchingStatusesRef = useRef<Set<ProblemStatus>>(new Set());

  // Fetches only the status map (ID -> Status), lightweight
  const fetchStatusMap = useCallback(async () => {
    if (user?.uid) {
      try {
        const statusResult = await userService.getAllUserProblemStatuses(user.uid);
        if (statusResult.isSuccess) {
          setProblemStatuses(statusResult.value);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch problem statuses.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch problem statuses.",
          variant: "destructive",
        });
      }
      setHasFetchedStatusMap(true);
    } else {
      setProblemStatuses({});
      setHasFetchedStatusMap(true);
    }
  }, [user, toast]);

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
      // Mark as hydrated
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
  }, [user, hasFetchedStatusMap, toast]);

  const updateProblemStatusLocally = useCallback(
    (
      problemId: string,
      status: ProblemStatus,
      companySlug?: string,
      problemSlug?: string,
    ) => {
      setProblemStatuses((prev) => {
        // If status is "none", remove it
        if (status === "none") {
          const next = { ...prev };
          delete next[problemId];
          return next;
        }

        const existing = prev[problemId];
        const effectiveCompanySlug = companySlug || existing?.companySlug || "";
        const effectiveProblemSlug = problemSlug || existing?.problemSlug || "";

        return {
          ...prev,
          [problemId]: {
            problemId,
            status,
            companySlug: effectiveCompanySlug,
            problemSlug: effectiveProblemSlug,
            updatedAt: new Date(),
          },
        };
      });
    },
    [],
  );

  // Initial Fetch: Status Map
  useEffect(() => {
    if (user && !authLoading) {
      fetchStatusMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Optimized stats calculation: iterate once instead of 3 times
  const stats = useMemo(() => {
    let solved = 0;
    let attempted = 0;
    let todo = 0;
    Object.values(problemStatuses).forEach((p) => {
      if (p?.status === "solved") {
        solved++;
      } else if (p?.status === "attempted") {
        attempted++;
      } else if (p?.status === "todo") {
        todo++;
      }
    });
    return { solved, attempted, todo };
  }, [problemStatuses]);

  return {
    problemStatuses,
    hasFetchedStatusMap,
    isLoadingStatuses,
    stats,
    fetchStatusMap,
    hydrateProblemsForStatus,
    updateProblemStatusLocally,
  };
}
