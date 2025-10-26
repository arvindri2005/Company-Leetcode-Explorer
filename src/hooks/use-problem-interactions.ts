"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  toggleBookmarkProblemAction,
  setProblemStatusAction,
} from "@/app/actions";
import type { LeetCodeProblem, ProblemStatus } from "@/types";
import { PROBLEM_STATUS_OPTIONS } from "@/types";
import { useRouter, usePathname } from "next/navigation";

export function useProblemInteractions(
  problem: LeetCodeProblem,
  companySlug: string,
  initialIsBookmarked: boolean,
  problemStatus: ProblemStatus,
  onBookmarkChanged?: (problemId: string, newStatus: boolean) => void,
  onProblemStatusChange?: (problemId: string, newStatus: ProblemStatus) => void,
) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  const [currentStatus, setCurrentStatus] =
    useState<ProblemStatus>(problemStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setIsBookmarked(initialIsBookmarked);
  }, [initialIsBookmarked]);

  useEffect(() => {
    setCurrentStatus(problemStatus);
  }, [problemStatus]);

  const redirectToLogin = useCallback(() => {
    router.push(`/login?redirectUrl=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  const handleToggleBookmark = async () => {
    if (!user) {
      redirectToLogin();
      return;
    }
    if (isTogglingBookmark) return;
    setIsTogglingBookmark(true);
    const oldStatus = isBookmarked;
    setIsBookmarked(!oldStatus);

    try {
      const effectiveCompanySlug = problem.companySlug || companySlug;
      const result = await toggleBookmarkProblemAction(
        user.uid,
        problem.id,
        effectiveCompanySlug,
        problem.slug,
      );
      if (result.success) {
        setIsBookmarked(result.isBookmarked ?? oldStatus);
        toast({
          title: result.isBookmarked ? "⭐ Bookmarked!" : "📖 Bookmark Removed",
          description: `"${problem.title}" ${
            result.isBookmarked ? "saved to" : "removed from"
          } your collection.`,
        });
        onBookmarkChanged?.(problem.id, result.isBookmarked ?? oldStatus);
      } else {
        setIsBookmarked(oldStatus);
        toast({
          title: "Bookmark Error",
          description: result.error || "Failed to update bookmark.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsBookmarked(oldStatus);
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  const handleStatusUpdate = async (newStatus: ProblemStatus) => {
    if (!user) {
      redirectToLogin();
      return;
    }
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    const oldUiStatus = currentStatus;
    setCurrentStatus(newStatus);

    try {
      const effectiveCompanySlug = problem.companySlug || companySlug;
      const result = await setProblemStatusAction(
        user.uid,
        problem.id,
        newStatus,
        effectiveCompanySlug,
        problem.slug,
      );
      if (result.success) {
        const statusLabel =
          newStatus === "none"
            ? "cleared"
            : `marked as ${
                PROBLEM_STATUS_OPTIONS.find((opt) => opt.value === newStatus)
                  ?.label
              }`;
        toast({
          title: "✅ Status Updated!",
          description: `"${problem.title}" ${statusLabel}.`,
        });
        onProblemStatusChange?.(problem.id, newStatus);
      } else {
        setCurrentStatus(oldUiStatus);
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setCurrentStatus(oldUiStatus);
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return {
    isBookmarked,
    isTogglingBookmark,
    handleToggleBookmark,
    currentStatus,
    isUpdatingStatus,
    handleStatusUpdate,
    redirectToLogin,
  };
}
