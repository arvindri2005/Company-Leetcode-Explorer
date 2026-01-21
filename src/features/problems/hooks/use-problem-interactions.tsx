"use client";

import { useCallback, useRef, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { ToastAction } from "@/components/ui/toast";
import { PROBLEM_STATUS_OPTIONS } from "@/features/problems/constants";
import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/hooks/use-toast";
import type { LeetCodeProblem, ProblemStatus } from "@/types";

export function useProblemInteractions(
  problem: LeetCodeProblem,
  companySlug: string,
  initialIsBookmarked: boolean,
  problemStatus: ProblemStatus,
  userId?: string,
  onBookmarkChanged?: (problemId: string, newStatus: boolean) => void,
  onProblemStatusChange?: (problemId: string, newStatus: ProblemStatus) => void,
) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // -- State Management for Bookmark --
  // Optimization: Use ref for optimistic state to avoid double-render on sync.
  const optimisticIsBookmarkedRef = useRef<boolean | null>(null);
  
  // Force update trigger to ensure renders when ref changes
  const [, setForceUpdate] = useState(0);

  // Sync logic: If props match optimistic, clear optimistic.
  if (optimisticIsBookmarkedRef.current === initialIsBookmarked) {
    optimisticIsBookmarkedRef.current = null;
  }

  const isBookmarked = optimisticIsBookmarkedRef.current ?? initialIsBookmarked;
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  // -- State Management for Status --
  const optimisticStatusRef = useRef<ProblemStatus | null>(null);

  if (optimisticStatusRef.current === problemStatus) {
    optimisticStatusRef.current = null;
  }

  const currentStatus = optimisticStatusRef.current ?? problemStatus;
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const promptLogin = useCallback(() => {
    toast({
      title: "Authentication Required",
      description: "Please log in to save your progress.",
      className: "border-primary shadow-[0_0_25px_rgba(45,212,191,0.6)]",
      action: (
        <ToastAction
          altText="Login"
          className="bg-primary text-primary-foreground hover:bg-primary/90 border-none"
          onClick={() =>
            router.push(`/login?redirectUrl=${encodeURIComponent(pathname)}`)
          }
        >
          Login
        </ToastAction>
      ),
    });
  }, [router, pathname, toast]);

  const handleToggleBookmark = useCallback(async () => {
    if (!userId) {
      promptLogin();
      return;
    }
    if (isTogglingBookmark) {
      return;
    }

    const nextValue = !isBookmarked;
    
    optimisticIsBookmarkedRef.current = nextValue;
    setForceUpdate((prev) => prev + 1);
    setIsTogglingBookmark(true);

    try {
      const effectiveCompanySlug = problem.companySlug || companySlug;
      const result = await userService.toggleBookmarkProblem(
        userId,
        problem.id,
        effectiveCompanySlug,
        problem.slug,
      );
      if (result.isSuccess) {
        const finalValue = result.value.isBookmarked ?? nextValue;

        if (finalValue !== nextValue) {
          optimisticIsBookmarkedRef.current = finalValue;
          // No need to force update here if we are about to update in finally
        }

        onBookmarkChanged?.(problem.id, finalValue);

        toast({
          title: finalValue ? "⭐ Bookmarked!" : "📖 Bookmark Removed",
          description: `"${problem.title}" ${
            finalValue ? "saved to" : "removed from"
          } your collection.`,
        });
      } else {
        optimisticIsBookmarkedRef.current = null; 
        toast({
          title: "Bookmark Error",
          description: result.error?.message || "Failed to update bookmark.",
          variant: "destructive",
        });
      }
    } catch {
      optimisticIsBookmarkedRef.current = null; 
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingBookmark(false);
      setForceUpdate((prev) => prev + 1);
    }
  }, [
    userId,
    promptLogin,
    isTogglingBookmark,
    isBookmarked,
    problem.companySlug,
    problem.id,
    problem.slug,
    problem.title,
    companySlug,
    onBookmarkChanged,
    toast,
  ]);

  const handleStatusUpdate = useCallback(async (newStatus: ProblemStatus) => {
    if (!userId) {
      promptLogin();
      return;
    }
    if (isUpdatingStatus) {
      return;
    }

    optimisticStatusRef.current = newStatus;
    setForceUpdate((prev) => prev + 1);
    setIsUpdatingStatus(true);

    try {
      const effectiveCompanySlug = problem.companySlug || companySlug;
      const result = await userService.setProblemStatus(
        userId,
        problem.id,
        newStatus,
        effectiveCompanySlug,
        problem.slug,
      );
      if (result.isSuccess) {
        onProblemStatusChange?.(problem.id, newStatus);

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
      } else {
        optimisticStatusRef.current = null; 
        toast({
          title: "Update Failed",
          description: result.error?.message || "Failed to update status.",
          variant: "destructive",
        });
      }
    } catch {
      optimisticStatusRef.current = null; 
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
      setForceUpdate((prev) => prev + 1);
    }
  }, [
    userId,
    promptLogin,
    isUpdatingStatus,
    problem.companySlug,
    problem.id,
    problem.slug,
    problem.title,
    companySlug,
    onProblemStatusChange,
    toast,
  ]);

  return {
    isBookmarked,
    isTogglingBookmark,
    handleToggleBookmark,
    currentStatus,
    isUpdatingStatus,
    handleStatusUpdate,
    promptLogin,
  };
}
