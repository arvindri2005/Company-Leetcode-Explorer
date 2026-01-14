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
  // We want to avoid useEffect syncing props to state to prevent double renders.
  // We use a "committed" state that defaults to the prop, but can be updated locally.
  // We also track the prop to update our committed state if the prop changes externally.
  const [committedIsBookmarked, setCommittedIsBookmarked] =
    useState(initialIsBookmarked);
  const prevInitialIsBookmarked = useRef(initialIsBookmarked);

  // If prop changes, sync it to committed state during render (Derived State pattern)
  if (initialIsBookmarked !== prevInitialIsBookmarked.current) {
    prevInitialIsBookmarked.current = initialIsBookmarked;
    setCommittedIsBookmarked(initialIsBookmarked);
  }

  const [optimisticIsBookmarked, setOptimisticIsBookmarked] = useState<
    boolean | null
  >(null);
  const isBookmarked = optimisticIsBookmarked ?? committedIsBookmarked;
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  // -- State Management for Status --
  const [committedStatus, setCommittedStatus] = useState(problemStatus);
  const prevProblemStatus = useRef(problemStatus);

  if (problemStatus !== prevProblemStatus.current) {
    prevProblemStatus.current = problemStatus;
    setCommittedStatus(problemStatus);
  }

  const [optimisticStatus, setOptimisticStatus] =
    useState<ProblemStatus | null>(null);
  const currentStatus = optimisticStatus ?? committedStatus;
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

  const handleToggleBookmark = async () => {
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
        
        // Update committed state to the new value
        setCommittedIsBookmarked(finalValue);
        // Clear optimistic state
        setOptimisticIsBookmarked(null);

        onBookmarkChanged?.(problem.id, finalValue);

        toast({
          title: finalValue ? "⭐ Bookmarked!" : "📖 Bookmark Removed",
          description: `"${problem.title}" ${
            finalValue ? "saved to" : "removed from"
          } your collection.`,
        });
      } else {
        setOptimisticIsBookmarked(null); // Revert to committed state
        toast({
          title: "Bookmark Error",
          description: result.error?.message || "Failed to update bookmark.",
          variant: "destructive",
        });
      }
    } catch {
      setOptimisticIsBookmarked(null); // Revert to committed state
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
        setCommittedStatus(newStatus);
        setOptimisticStatus(null);
        
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
  };

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
