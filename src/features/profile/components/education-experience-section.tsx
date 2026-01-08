"use client";

import React from "react";
import { useFormContext, FormProvider } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExperienceListSkeleton } from "@/components/skeletons/experience-skeleton";
import { PlusCircle, GraduationCap, Loader2 } from "lucide-react";
import type { EducationExperience } from "@/types";
import { EducationExperienceSchema as educationFormSchema } from "@/types"; // Renamed for clarity

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
            <GraduationCap className="mr-3 text-primary" />
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
              <PlusCircle className="mr-2 h-4 w-4" /> Add Education
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Educational Experience</DialogTitle>
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
                        <Loader2 className="animate-spin h-4 w-4" />
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
        {isLoadingEducation ? (
          <ExperienceListSkeleton />
        ) : educationHistory.length > 0 ? (
          <ul className="space-y-3 mt-4">
            {educationHistory.map((edu) => (
              <li
                key={edu.id}
                className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm"
              >
                <h4 className="font-semibold">
                  {edu.degree} in {edu.major}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {edu.school}
                  {edu.graduationYear && `, Graduated ${edu.graduationYear}`}
                  {edu.gpa && `, GPA: ${edu.gpa}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No educational background added yet.
          </p>
        )}
      </div>
    </>
  );
};

export default EducationExperienceSection;






