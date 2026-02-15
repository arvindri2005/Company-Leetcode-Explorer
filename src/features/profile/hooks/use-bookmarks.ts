/**
 * @fileoverview Hook for fetching and managing bookmarked problems
 */
"use client";

import { useCallback, useEffect, useState } from "react";

import type { User } from "@supabase/supabase-js";

import { getProblemsByIdsBatchAction } from "@/features/problems/actions/problem.actions";
import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/shared/hooks/use-toast";
import type { LeetCodeProblem, ProblemStatus } from "@/shared/types";

interface ProblemWithDetails extends LeetCodeProblem {
  currentStatus?: ProblemStatus;
  isBookmarked?: boolean;
}

export interface BookmarksData {
  bookmarkedProblemDetails: ProblemWithDetails[];
  isLoadingBookmarks: boolean;
  fetchBookmarkedData: () => Promise<void>;
  handleProblemBookmarkChange: (problemId: string, newStatus: boolean) => void;
}

/**
 * Hook for managing bookmarked problems
 * 
 * @param user - Supabase user object
 * @param authLoading - Whether authentication is loading
 * @returns BookmarksData object with bookmarks and fetch functions
 */
export function useBookmarks(
  user: User | null,
  authLoading: boolean
): BookmarksData {
  const { toast } = useToast();
  const [bookmarkedProblemDetails, setBookmarkedProblemDetails] = useState<ProblemWithDetails[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  const fetchBookmarkedData = useCallback(async () => {
    if (user?.id) {
      setIsLoadingBookmarks(true);
      try {
        const bookmarkInfosResult = await userService.getBookmarkedProblemsInfo(user.id);
        if (!bookmarkInfosResult.isSuccess) {
          toast({
            title: "Error",
            description: "Could not fetch bookmarked problems.",
            variant: "destructive",
          });
          setBookmarkedProblemDetails([]);
          setIsLoadingBookmarks(false);
          return;
        }
        const bookmarkInfos = bookmarkInfosResult.value;
        const problemIds = bookmarkInfos
          .map((info) => info.problemSlug)
          .filter(Boolean);

        if (problemIds.length === 0) {
          setBookmarkedProblemDetails([]);
          setIsLoadingBookmarks(false);
          return;
        }

        const result = await getProblemsByIdsBatchAction(problemIds);

        if (result.success && result.data) {
          const problemsMap = new Map(result.data.map((p) => [p.slug, p]));

          const problems = bookmarkInfos
            .map((info) => {
              const problem = problemsMap.get(info.problemSlug);
              if (!problem) {
                return null;
              }
              return {
                ...problem,
                companySlug: info.companySlug || problem.companySlug,
                isBookmarked: true,
              } as ProblemWithDetails;
            })
            .filter((p): p is ProblemWithDetails => p !== null);

          setBookmarkedProblemDetails(problems);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch bookmarked problems details.",
            variant: "destructive",
          });
          setBookmarkedProblemDetails([]);
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch bookmarked problems.",
          variant: "destructive",
        });
        setBookmarkedProblemDetails([]);
      }
      setIsLoadingBookmarks(false);
    } else {
      setBookmarkedProblemDetails([]);
    }
  }, [user, toast]);

  const handleProblemBookmarkChange = useCallback(
    (problemId: string, newStatus: boolean) => {
      setBookmarkedProblemDetails(
        (prev) =>
          newStatus
            ? prev.map((p) =>
                p.id === problemId ? { ...p, isBookmarked: true } : p,
              )
            : prev.filter((p) => p.id !== problemId), // If unbookmarked, remove from list
      );
    },
    [],
  );

  // Initial Fetch: Bookmarks (default tab)
  useEffect(() => {
    if (user && !authLoading) {
      fetchBookmarkedData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  return {
    bookmarkedProblemDetails,
    isLoadingBookmarks,
    fetchBookmarkedData,
    handleProblemBookmarkChange,
  };
}
