/**
 * @fileoverview Hook for fetching and managing work experience
 */
"use client";

import { useCallback, useState } from "react";

import type { User as FirebaseUser } from "firebase/auth";

import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/shared/hooks/use-toast";
import type { WorkExperience } from "@/shared/types";

type WorkExperienceFormValues = Omit<WorkExperience, "id">;

export interface WorkExperienceData {
  workExperience: WorkExperience[];
  isLoadingWorkExperience: boolean;
  hasFetchedWorkExperience: boolean;
  isWorkDialogOpen: boolean;
  setIsWorkDialogOpen: (open: boolean) => void;
  fetchWorkExperience: () => Promise<void>;
  handleAddWorkExperience: (data: WorkExperienceFormValues) => Promise<void>;
}

/**
 * Hook for managing work experience
 * 
 * @param user - Firebase user object
 * @returns WorkExperienceData object with work experience data and functions
 */
export function useWorkExperience(user: FirebaseUser | null): WorkExperienceData {
  const { toast } = useToast();
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [isLoadingWorkExperience, setIsLoadingWorkExperience] = useState(false);
  const [hasFetchedWorkExperience, setHasFetchedWorkExperience] = useState(false);
  const [isWorkDialogOpen, setIsWorkDialogOpen] = useState(false);

  const fetchWorkExperience = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingWorkExperience(true);
      try {
        const result = await userService.getUserWorkExperience(user.uid);
        if (result.isSuccess) {
          setWorkExperience(result.value);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch work experience.",
            variant: "destructive",
          });
          setWorkExperience([]);
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch work experience.",
          variant: "destructive",
        });
        setWorkExperience([]);
      }
      setIsLoadingWorkExperience(false);
      setHasFetchedWorkExperience(true);
    } else {
      setWorkExperience([]);
    }
  }, [user, toast]);

  const handleAddWorkExperience = useCallback(async (data: WorkExperienceFormValues) => {
    if (!user) {
      return;
    }
    const result = await userService.addUserWorkExperience(user.uid, data);
    if (result.isSuccess && result.value.id) {
      toast({
        title: "Work Experience Added",
        description: "Your work history has been updated.",
      });

      const newWorkExperience: WorkExperience = {
        id: result.value.id,
        ...data,
      };

      // Optimistically update local state to avoid an extra network fetch
      setWorkExperience((prev) => [...prev, newWorkExperience]);
      setIsWorkDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.isFailure ? result.error.message : "Could not add work experience.",
        variant: "destructive",
      });
    }
  }, [user, fetchWorkExperience, toast]);

  return {
    workExperience,
    isLoadingWorkExperience,
    hasFetchedWorkExperience,
    isWorkDialogOpen,
    setIsWorkDialogOpen,
    fetchWorkExperience,
    handleAddWorkExperience,
  };
}
