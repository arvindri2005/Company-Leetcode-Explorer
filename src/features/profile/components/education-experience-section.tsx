"use client";

import React, { memo } from "react";
import { FormProvider, useFormContext } from "react-hook-form";

import { GraduationCap, Loader2, PlusCircle } from "lucide-react";
import { type z } from "zod";

import { ExperienceListSkeleton } from "@/components/skeletons/experience-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { EducationExperience } from "@/types";
import { type EducationExperienceSchema as educationFormSchema } from "@/types"; // Renamed for clarity

type EducationFormValues = z.infer<typeof educationFormSchema>;

/**
 * @interface EducationExperienceSectionProps
 * @description Props for the EducationExperienceSection component.
 * @property {string} userId - The ID of the user.
 * @property {EducationExperience[]} educationHistory - A list of the user's educational experiences.
 * @property {boolean} isLoadingEducation - A flag indicating if the education data is loading.
 * @property {(data: EducationFormValues) => Promise<void>} handleAddEducation - The function to call when adding a new education entry.
 * @property {boolean} isEducationDialogOpen - A flag indicating if the education dialog is open.
 * @property {(isOpen: boolean) => void} setIsEducationDialogOpen - The function to call when setting the education dialog open state.
 */
interface EducationExperienceSectionProps {
  userId: string; // Needed for keying if delete/edit were added
  educationHistory: EducationExperience[];
  isLoadingEducation: boolean;
  handleAddEducation: (data: EducationFormValues) => Promise<void>;
  // educationForm: UseFormReturn<EducationFormValues>; // To be provided by FormProvider
  isEducationDialogOpen: boolean;
  setIsEducationDialogOpen: (isOpen: boolean) => void;
}

/**
 * @component EducationHistoryItem
 * @description A memoized component to render a single education history item.
 * This prevents unnecessary re-renders of the list items when parent state changes.
 */
const EducationHistoryItem = memo(({ edu }: { edu: EducationExperience }) => (
  <li className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
    <h4 className="font-semibold">
      {edu.degree} in {edu.major}
    </h4>
    <p className="text-sm text-muted-foreground">
      {edu.school}
      {edu.graduationYear && `, Graduated ${edu.graduationYear}`}
      {edu.gpa && `, GPA: ${edu.gpa}`}
    </p>
  </li>
));
EducationHistoryItem.displayName = "EducationHistoryItem";

/**
 * @function EducationExperienceSection
 * @description A component that displays a user's educational background and allows them to add new entries.
 * @param {EducationExperienceSectionProps} props - The props for the component.
 * @returns {JSX.Element} - The rendered component.
 */
const EducationExperienceSection: React.FC<EducationExperienceSectionProps> = ({
  educationHistory,
  isLoadingEducation,
  handleAddEducation,
  isEducationDialogOpen,
  setIsEducationDialogOpen,
}) => {
  const educationForm = useFormContext<EducationFormValues>();

  return (
    <>
      <div className="flex flex-row items-center justify-between bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold flex items-center">
            <GraduationCap className="mr-3 text-primary" aria-hidden="true" />
            Educational Background
          </h3>
          <p className="text-muted-foreground">Your academic qualifications.</p>
        </div>
        <Dialog
          open={isEducationDialogOpen}
          onOpenChange={setIsEducationDialogOpen}
          modal={false}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Add Education
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Educational Experience</DialogTitle>
              <DialogDescription>
                Enter your school details, degree, and graduation year.
              </DialogDescription>
            </DialogHeader>
            <FormProvider {...educationForm}>
              <Form {...educationForm}>
                <form
                  onSubmit={educationForm.handleSubmit(handleAddEducation)}
                  className="space-y-4"
                >
                  <FormField
                    control={educationForm.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School/University</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoFocus
                            autoComplete="organization"
                            autoCapitalize="words"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={educationForm.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="off"
                            autoCapitalize="words"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={educationForm.control}
                    name="major"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Major/Field of Study</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="off"
                            autoCapitalize="words"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={educationForm.control}
                    name="graduationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Year (YYYY, Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="YYYY"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={educationForm.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            inputMode="decimal"
                            maxLength={5}
                            placeholder="4.0"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={educationForm.formState.isSubmitting}
                    >
                      {educationForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Education"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        {(() => {
          if (isLoadingEducation) {
            return <ExperienceListSkeleton />;
          }
          if (educationHistory.length > 0) {
            return (
              <ul className="space-y-3 mt-4">
                {educationHistory.map((edu) => (
                  <EducationHistoryItem key={edu.id} edu={edu} />
                ))}
              </ul>
            );
          }
          return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted rounded-xl bg-muted/5">
              <div className="bg-background p-3 rounded-full mb-4 ring-1 ring-border shadow-sm">
                <GraduationCap className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No education added
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Add your academic qualifications to build your profile.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEducationDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Add Education
              </Button>
            </div>
          );
        })()}
      </div>
    </>
  );
};

export default memo(EducationExperienceSection);
