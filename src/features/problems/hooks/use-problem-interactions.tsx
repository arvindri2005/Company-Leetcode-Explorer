"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers";
import { userService } from "@/features/profile/services/user.service";
import type { LeetCodeProblem, ProblemStatus } from "@/types";
import { PROBLEM_STATUS_OPTIONS } from "@/features/problems/constants";
import { useRouter, usePathname } from "next/navigation";
import { ToastAction } from "@/components/ui/toast";

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

  const promptLogin = useCallback(() => {
    toast({
      title: "Authentication Required",
      description: "Please log in to save your progress.",
      className: "border-primary shadow-[0_0_25px_rgba(45,212,191,0.6)]", // Stronger teal glow
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
    if (!user) {
      promptLogin();
      return;
    }
    if (isTogglingBookmark) return;
    setIsTogglingBookmark(true);
    const oldStatus = isBookmarked;
    setIsBookmarked(!oldStatus);

    try {
      const effectiveCompanySlug = problem.companySlug || companySlug;
      const result = await userService.toggleBookmarkProblem(
        user.uid,
        problem.id,
        effectiveCompanySlug,
        problem.slug,
      );
      if (result.isSuccess) {
        setIsBookmarked(result.value.isBookmarked ?? oldStatus);
        toast({
          title: result.value.isBookmarked ? "⭐ Bookmarked!" : "📖 Bookmark Removed",
          description: `"${problem.title}" ${
            result.value.isBookmarked ? "saved to" : "removed from"
          } your collection.`,
        });
        onBookmarkChanged?.(problem.id, result.value.isBookmarked ?? oldStatus);
      } else {
        setIsBookmarked(oldStatus);
        toast({
          title: "Bookmark Error",
          description: result.error?.message || "Failed to update bookmark.",
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
      promptLogin();
      return;
    }
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    const oldUiStatus = currentStatus;
    setCurrentStatus(newStatus);

    try {
      const effectiveCompanySlug = problem.companySlug || companySlug;
      const result = await userService.setProblemStatus(
        user.uid,
        problem.id,
        newStatus,
        effectiveCompanySlug,
        problem.slug,
      );
      if (result.isSuccess) {
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
          description: result.error?.message || "Failed to update status.",
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
    promptLogin,
  };
}






