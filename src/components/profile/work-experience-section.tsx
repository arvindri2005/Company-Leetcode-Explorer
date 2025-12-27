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
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Briefcase, Loader2 } from "lucide-react";
import type { WorkExperience } from "@/types";
import { WorkExperienceSchema as workExperienceFormSchema } from "@/types"; // Renamed for clarity

type WorkExperienceFormValues = z.infer<typeof workExperienceFormSchema>;

/**
 * @interface WorkExperienceSectionProps
 * @description Props for the WorkExperienceSection component.
 * @property {string} userId - The user's ID.
 * @property {WorkExperience[]} workExperience - An array of the user's work experiences.
 * @property {boolean} isLoadingWorkExperience - Flag indicating if work experience data is loading.
 * @property {(data: WorkExperienceFormValues) => Promise<void>} handleAddWorkExperience - Async function to handle adding a new work experience entry.
 * @property {boolean} isWorkDialogOpen - Flag indicating if the 'add work experience' dialog is open.
 * @property {(isOpen: boolean) => void} setIsWorkDialogOpen - Function to set the state of the 'add work experience' dialog.
 */
interface WorkExperienceSectionProps {
  userId: string; // Needed for keying if delete/edit were added
  workExperience: WorkExperience[];
  isLoadingWorkExperience: boolean;
  handleAddWorkExperience: (data: WorkExperienceFormValues) => Promise<void>;
  // workForm: UseFormReturn<WorkExperienceFormValues>; // To be provided by FormProvider
  isWorkDialogOpen: boolean;
  setIsWorkDialogOpen: (isOpen: boolean) => void;
}

/**
 * @function WorkExperienceSection
 * @description A component that displays a user's professional work experience and provides a dialog to add new entries.
 * @param {WorkExperienceSectionProps} props - The props for the component.
 * @returns {JSX.Element} The rendered section displaying work history, a loading state, or an empty state message.
 */
const WorkExperienceSection: React.FC<WorkExperienceSectionProps> = ({
  workExperience,
  isLoadingWorkExperience,
  handleAddWorkExperience,
  isWorkDialogOpen,
  setIsWorkDialogOpen,
}) => {
  const workForm = useFormContext<WorkExperienceFormValues>();

  return (
    <>
      <div className="flex flex-row items-center justify-between bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold flex items-center">
            <Briefcase className="mr-3 text-primary" />
            Work Experience
          </h3>
          <p className="text-muted-foreground">
            Your professional roles and responsibilities.
          </p>
        </div>
        <Dialog
          open={isWorkDialogOpen}
          onOpenChange={setIsWorkDialogOpen}
          modal={false}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Work Experience
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Work Experience</DialogTitle>
            </DialogHeader>
            <FormProvider {...workForm}>
              <Form {...workForm}>
                <form
                  onSubmit={workForm.handleSubmit(handleAddWorkExperience)}
                  className="space-y-4"
                >
                  <FormField
                    control={workForm.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="organization-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={workForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="organization" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={workForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date (MM/YYYY)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="MM/YYYY"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={workForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            End Date (MM/YYYY or Present, Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="MM/YYYY or Present"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={workForm.control}
                    name="responsibilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Responsibilities (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={workForm.formState.isSubmitting}
                    >
                      {workForm.formState.isSubmitting ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        "Save Experience"
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
        {isLoadingWorkExperience ? (
          <Skeleton className="h-20 w-full" />
        ) : workExperience.length > 0 ? (
          <ul className="space-y-3 mt-4">
            {workExperience.map((work) => (
              <li
                key={work.id}
                className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm"
              >
                <h4 className="font-semibold">
                  {work.jobTitle} at {work.companyName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {work.startDate} - {work.endDate || "Present"}
                </p>
                {work.responsibilities && (
                  <p className="text-sm mt-1 whitespace-pre-line">
                    {work.responsibilities}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No work experience added yet.
          </p>
        )}
      </div>
    </>
  );
};

export default WorkExperienceSection;
