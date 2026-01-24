/**
 * @fileoverview Education tab component for profile page
 */
"use client";

import { FormProvider, type UseFormReturn } from "react-hook-form";

import ErrorBoundary from "@/components/ui/error-boundary";
import { TabsContent } from "@/components/ui/tabs";
import EducationExperienceSection from "@/features/profile/components/education-experience-section";
import ProfileTabErrorFallback from "@/features/profile/components/profile-tab-error-fallback";
import WorkExperienceSection from "@/features/profile/components/work-experience-section";
import type { EducationExperience, WorkExperience } from "@/types";

type EducationFormValues = Omit<EducationExperience, "id">;
type WorkExperienceFormValues = Omit<WorkExperience, "id">;

export interface EducationTabProps {
  userId: string;
  educationHistory: EducationExperience[];
  isLoadingEducation: boolean;
  handleAddEducation: (data: EducationFormValues) => Promise<void>;
  isEducationDialogOpen: boolean;
  setIsEducationDialogOpen: (open: boolean) => void;
  educationForm: UseFormReturn<EducationFormValues>;
  workExperience: WorkExperience[];
  isLoadingWorkExperience: boolean;
  handleAddWorkExperience: (data: WorkExperienceFormValues) => Promise<void>;
  isWorkDialogOpen: boolean;
  setIsWorkDialogOpen: (open: boolean) => void;
  workForm: UseFormReturn<WorkExperienceFormValues>;
}

/**
 * EducationTab component displays education and work experience sections
 * Note: This combines both education and work experience as they appear together in the background tab
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function EducationTab({
  userId,
  educationHistory,
  isLoadingEducation,
  handleAddEducation,
  isEducationDialogOpen,
  setIsEducationDialogOpen,
  educationForm,
  workExperience,
  isLoadingWorkExperience,
  handleAddWorkExperience,
  isWorkDialogOpen,
  setIsWorkDialogOpen,
  workForm,
}: EducationTabProps) {
  return (
    <TabsContent value="background">
      <ErrorBoundary
        fallbackRender={(props) => (
          <ProfileTabErrorFallback {...props} tabName="Background" />
        )}
      >
        <div className="space-y-8 bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
          <FormProvider {...educationForm}>
            <EducationExperienceSection
              userId={userId}
              educationHistory={educationHistory}
              isLoadingEducation={isLoadingEducation}
              handleAddEducation={handleAddEducation}
              isEducationDialogOpen={isEducationDialogOpen}
              setIsEducationDialogOpen={setIsEducationDialogOpen}
            />
          </FormProvider>
          <FormProvider {...workForm}>
            <WorkExperienceSection
              userId={userId}
              workExperience={workExperience}
              isLoadingWorkExperience={isLoadingWorkExperience}
              handleAddWorkExperience={handleAddWorkExperience}
              isWorkDialogOpen={isWorkDialogOpen}
              setIsWorkDialogOpen={setIsWorkDialogOpen}
            />
          </FormProvider>
        </div>
      </ErrorBoundary>
    </TabsContent>
  );
}
