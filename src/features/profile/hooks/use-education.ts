/**
 * @fileoverview Hook for fetching and managing education history
 */
"use client";

import { useCallback, useState } from "react";

import type { User } from "@supabase/supabase-js";

import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/shared/hooks/use-toast";
import type { EducationExperience } from "@/shared/types";

type EducationFormValues = Omit<EducationExperience, "id">;

export interface EducationData {
  educationHistory: EducationExperience[];
  isLoadingEducation: boolean;
  hasFetchedEducation: boolean;
  isEducationDialogOpen: boolean;
  setIsEducationDialogOpen: (open: boolean) => void;
  fetchEducation: () => Promise<void>;
  handleAddEducation: (data: EducationFormValues) => Promise<void>;
}

/**
 * Hook for managing education history
 * 
 * @param user - Supabase user object
 * @returns EducationData object with education data and functions
 */
export function useEducation(user: User | null): EducationData {
  const { toast } = useToast();
  const [educationHistory, setEducationHistory] = useState<EducationExperience[]>([]);
  const [isLoadingEducation, setIsLoadingEducation] = useState(false);
  const [hasFetchedEducation, setHasFetchedEducation] = useState(false);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);

  const fetchEducation = useCallback(async () => {
    if (user?.id) {
      setIsLoadingEducation(true);
      try {
        const result = await userService.getUserEducation(user.id);
        if (result.isSuccess) {
          setEducationHistory(result.value);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch education history.",
            variant: "destructive",
          });
          setEducationHistory([]);
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch education history.",
          variant: "destructive",
        });
        setEducationHistory([]);
      }
      setIsLoadingEducation(false);
      setHasFetchedEducation(true);
    } else {
      setEducationHistory([]);
    }
  }, [user, toast]);

  const handleAddEducation = useCallback(async (data: EducationFormValues) => {
    if (!user) {
      return;
    }
    const result = await userService.addUserEducation(user.id, data);
    if (result.isSuccess && result.value.id) {
      toast({
        title: "Education Added",
        description: "Your educational background has been updated.",
      });

      const newEducation: EducationExperience = {
        id: result.value.id,
        ...data,
      };

      // Optimistically update local state to avoid an extra network fetch
      setEducationHistory((prev) => [...prev, newEducation]);
      setIsEducationDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.isFailure ? result.error.message : "Could not add education.",
        variant: "destructive",
      });
    }
  }, [user, fetchEducation, toast]);

  return {
    educationHistory,
    isLoadingEducation,
    hasFetchedEducation,
    isEducationDialogOpen,
    setIsEducationDialogOpen,
    fetchEducation,
    handleAddEducation,
  };
}
