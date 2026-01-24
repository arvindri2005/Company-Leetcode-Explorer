/**
 * @fileoverview Hook for fetching and managing bookmarked problems
 */
"use client";

import { useCallback, useEffect, useState } from "react";

import type { User as FirebaseUser } from "firebase/auth";

import { getProblemByCompanySlugAndProblemSlugAction } from "@/app/actions/problem.actions";
import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/hooks/use-toast";
import type { LeetCodeProblem, ProblemStatus } from "@/types";

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
 * @param user - Firebase user object
 * @param authLoading - Whether authentication is loading
 * @returns BookmarksData object with bookmarks and fetch functions
 */
export function useBookmarks(
  user: FirebaseUser | null,
  authLoading: boolean
): BookmarksData {
  const { toast } = useToast();
  const [bookmarkedProblemDetails, setBookmarkedProblemDetails] = useState<ProblemWithDetails[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  const fetchBookmarkedData = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingBookmarks(true);
      try {
        const bookmarkInfosResult = await userService.getBookmarkedProblemsInfo(user.uid);
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
        const detailedProblemsPromises = bookmarkInfosResult.value.map(
          async (info) => {
            if (!info.companySlug || !info.problemSlug) {
              return null;
            }
            try {
              const result = await getProblemByCompanySlugAndProblemSlugAction(
                info.companySlug,
                info.problemSlug,
              );
              if (result.success && result.data?.problem) {
                return {
                  ...result.data.problem,
                  isBookmarked: true,
                } as ProblemWithDetails;
              }
              return null;
            } catch {
              return null;
            }
          },
        );
        setBookmarkedProblemDetails(
          (await Promise.all(detailedProblemsPromises)).filter(
            Boolean,
          ) as ProblemWithDetails[],
        );
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
