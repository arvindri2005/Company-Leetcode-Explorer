"use client";

import { useCallback, useState } from "react";

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
  // Optimization: Removed duplicate "committed" state and effects.
  // We rely on "Optimistic UI" pattern:
  // 1. User acts -> Set optimistic state.
  // 2. Prop updates -> If prop matches optimistic, clear optimistic (yield to prop).
  // 3. Fallback -> If prop never updates (uncontrolled), optimistic state persists as local state.
  
  const [optimisticIsBookmarked, setOptimisticIsBookmarked] = useState<
    boolean | null
  >(null);

  // If the prop has caught up to our optimistic state, we can clear the override.
  // This "update during render" pattern allows React to restart the render immediately with clean state,
  // preventing a double-paint flicker.
  if (optimisticIsBookmarked === initialIsBookmarked) {
    setOptimisticIsBookmarked(null);
  }

  const isBookmarked = optimisticIsBookmarked ?? initialIsBookmarked;
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  // -- State Management for Status --
  const [optimisticStatus, setOptimisticStatus] =
    useState<ProblemStatus | null>(null);

  if (optimisticStatus === problemStatus) {
    setOptimisticStatus(null);
  }

  const currentStatus = optimisticStatus ?? problemStatus;
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
    // Set optimistic state immediately
    setOptimisticIsBookmarked(nextValue);
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

        // If the result differs from our optimistic guess (rare), update optimistic to match result.
        // Otherwise, keep optimistic state until prop updates.
        if (finalValue !== nextValue) {
          setOptimisticIsBookmarked(finalValue);
        }

        onBookmarkChanged?.(problem.id, finalValue);

        toast({
          title: finalValue ? "⭐ Bookmarked!" : "📖 Bookmark Removed",
          description: `"${problem.title}" ${
            finalValue ? "saved to" : "removed from"
          } your collection.`,
        });
      } else {
        setOptimisticIsBookmarked(null); // Revert to prop
        toast({
          title: "Bookmark Error",
          description: result.error?.message || "Failed to update bookmark.",
          variant: "destructive",
        });
      }
    } catch {
      setOptimisticIsBookmarked(null); // Revert to prop
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingBookmark(false);
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

    setOptimisticStatus(newStatus);
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
        // Keep optimistic status until prop updates

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
        setOptimisticStatus(null); // Revert
        toast({
          title: "Update Failed",
          description: result.error?.message || "Failed to update status.",
          variant: "destructive",
        });
      }
    } catch {
      setOptimisticStatus(null); // Revert
      toast({
        title: "Connection Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
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
